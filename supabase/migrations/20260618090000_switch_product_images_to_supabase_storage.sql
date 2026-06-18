-- Migration: Switch v_products_admin image URLs from R2-backed CDN to Supabase Storage
--
-- Background: cdn.gaolamthuy.vn serves from Cloudflare R2 which is stale/out-of-sync.
-- Frontend (useUploadProductImage) and Windmill (upload_product_photo) already write
-- all variants to Supabase Storage bucket "product-images". Only this view still
-- constructed URLs pointing at the stale R2 CDN, causing newly processed images
-- (e.g. closeup-display) to 404.
--
-- Change: build the public Supabase Storage URL instead, and include `rev` for
-- cache-busting on re-upload (upsert keeps the same path but changes content).

CREATE OR REPLACE VIEW v_products_admin AS
WITH po_totals AS (
    SELECT pod.purchase_order_id,
        sum(pod.quantity) AS total_qty
    FROM kv_purchase_order_details pod
    GROUP BY pod.purchase_order_id
),
purchase_order_totals AS (
    SELECT pod.product_id,
        pod.purchase_order_id,
        pod.quantity,
        pod.price,
        pod.discount,
        po.purchase_date,
        po.code AS purchase_order_code,
        po.supplier_name,
        CASE
            WHEN pod.quantity > 0 THEN pod.quantity * pod.price * (1 - COALESCE(pod.discount, 0) / 100) / pod.quantity
            ELSE 0
        END AS base_cost_per_unit,
        round(
            CASE
                WHEN COALESCE(pt.total_qty, 0) > 0 THEN (po.ex_return_third_party + COALESCE(po.ex_return_suppliers, 0)) / pt.total_qty
                ELSE 0
            END, -2
        ) AS glt_extra_cost_per_unit,
        CASE
            WHEN pod.quantity > 0 THEN pod.quantity * pod.price * (1 - COALESCE(pod.discount, 0) / 100) / pod.quantity
            ELSE 0
        END + round(
            CASE
                WHEN COALESCE(pt.total_qty, 0) > 0 THEN (po.ex_return_third_party + COALESCE(po.ex_return_suppliers, 0)) / pt.total_qty
                ELSE 0
            END, -2
        ) AS total_cost_per_unit
    FROM kv_purchase_order_details pod
    JOIN kv_purchase_orders po ON po.id = pod.purchase_order_id
    LEFT JOIN po_totals pt ON pt.purchase_order_id = pod.purchase_order_id
    WHERE po.status = 3
),
latest_po_per_product AS (
    SELECT DISTINCT ON (purchase_order_totals.product_id)
        purchase_order_totals.product_id,
        purchase_order_totals.purchase_order_id AS latest_purchase_order_id,
        purchase_order_totals.total_cost_per_unit AS latest_total_cost_per_unit,
        purchase_order_totals.purchase_date AS latest_purchase_date,
        purchase_order_totals.purchase_order_code AS latest_purchase_order_code,
        purchase_order_totals.price AS latest_price,
        purchase_order_totals.glt_extra_cost_per_unit AS latest_extra_cost_per_unit,
        purchase_order_totals.base_cost_per_unit AS latest_base_cost_per_unit,
        purchase_order_totals.supplier_name AS latest_supplier_name
    FROM purchase_order_totals
    ORDER BY purchase_order_totals.product_id, purchase_order_totals.purchase_date DESC
),
recent_purchases_cte AS (
    SELECT ranked.product_id,
        jsonb_agg(jsonb_build_object(
            'purchase_order_id', ranked.purchase_order_id,
            'purchase_order_code', ranked.purchase_order_code,
            'purchase_date', ranked.purchase_date,
            'supplier_name', ranked.supplier_name,
            'price', ranked.price,
            'quantity', ranked.quantity,
            'glt_extra_cost_per_unit', ranked.glt_extra_cost_per_unit,
            'total_cost_per_unit', ranked.total_cost_per_unit
        )) AS recent_purchases
    FROM (
        SELECT purchase_order_totals.product_id,
            purchase_order_totals.purchase_order_id,
            purchase_order_totals.quantity,
            purchase_order_totals.price,
            purchase_order_totals.discount,
            purchase_order_totals.purchase_date,
            purchase_order_totals.purchase_order_code,
            purchase_order_totals.supplier_name,
            purchase_order_totals.base_cost_per_unit,
            purchase_order_totals.glt_extra_cost_per_unit,
            purchase_order_totals.total_cost_per_unit,
            row_number() OVER (PARTITION BY purchase_order_totals.product_id ORDER BY purchase_order_totals.purchase_date DESC) AS rn
        FROM purchase_order_totals
    ) ranked
    WHERE ranked.rn <= 5
    GROUP BY ranked.product_id
),
purchase_stats_cte AS (
    SELECT pot.product_id,
        jsonb_build_object(
            'avg_price', avg(pot.price),
            'avg_total_cost', avg(pot.total_cost_per_unit),
            'min_price', min(pot.price),
            'max_price', max(pot.price),
            'latest_price', lp_1.latest_price,
            'latest_total_cost', lp_1.latest_total_cost_per_unit,
            'total_quantity', sum(pot.quantity),
            'purchase_count', count(*)
        ) AS purchase_stats
    FROM purchase_order_totals pot
    LEFT JOIN latest_po_per_product lp_1 ON lp_1.product_id = pot.product_id
    GROUP BY pot.product_id, lp_1.latest_price, lp_1.latest_total_cost_per_unit
),
role_images AS (
    SELECT glt_product_images.product_id,
        glt_product_images.role,
        jsonb_object_agg(
            glt_product_images.image_type ||
                CASE WHEN glt_product_images.is_thumbnail THEN '_thumbnail' ELSE '' END,
            jsonb_build_object(
                'id', glt_product_images.id,
                'path', glt_product_images.path,
                'url', 'https://wvckxasjbydyvqgwgdhg.supabase.co/storage/v1/object/public/product-images/' || glt_product_images.path,
                'rev', glt_product_images.rev,
                'width', glt_product_images.width,
                'height', glt_product_images.height,
                'format', glt_product_images.format
            )
        ) AS images
    FROM glt_product_images
    GROUP BY glt_product_images.product_id, glt_product_images.role
),
changelog_cte AS (
    SELECT sub.kiotviet_id,
        COALESCE(jsonb_object_agg(sub.field, sub.changes), '{}'::jsonb) AS changelog
    FROM (
        SELECT ranked.kiotviet_id,
            ranked.field,
            jsonb_agg(jsonb_build_object(
                'old', ranked.old_value,
                'new', ranked.new_value,
                'diff',
                    CASE
                        WHEN ranked.old_value ~ '^[0-9.]+$' AND ranked.new_value ~ '^[0-9.]+$' THEN ranked.new_value::numeric - ranked.old_value::numeric
                        ELSE NULL
                    END,
                'pct',
                    CASE
                        WHEN ranked.old_value ~ '^[0-9.]+$' AND ranked.new_value ~ '^[0-9.]+$' AND ranked.old_value::numeric <> 0 THEN round((ranked.new_value::numeric - ranked.old_value::numeric) / ranked.old_value::numeric * 100, 2)
                        ELSE NULL
                    END,
                'dir',
                    CASE
                        WHEN ranked.old_value ~ '^[0-9.]+$' AND ranked.new_value ~ '^[0-9.]+$' THEN
                            CASE
                                WHEN ranked.new_value::numeric > ranked.old_value::numeric THEN 'up'
                                WHEN ranked.new_value::numeric < ranked.old_value::numeric THEN 'down'
                                ELSE NULL
                            END
                        ELSE NULL
                    END,
                'src', ranked.source,
                'at', ranked.created_at
            ) ORDER BY ranked.created_at DESC) AS changes
        FROM (
            SELECT glt_product_changelogs.id,
                glt_product_changelogs.kiotviet_id,
                glt_product_changelogs.field,
                glt_product_changelogs.old_value,
                glt_product_changelogs.new_value,
                glt_product_changelogs.created_at,
                glt_product_changelogs.raw_old_value,
                glt_product_changelogs.source,
                row_number() OVER (PARTITION BY glt_product_changelogs.kiotviet_id, glt_product_changelogs.field ORDER BY glt_product_changelogs.created_at DESC) AS rn
            FROM glt_product_changelogs
        ) ranked
        WHERE ranked.rn <= 5
        GROUP BY ranked.kiotviet_id, ranked.field
    ) sub
    GROUP BY sub.kiotviet_id
),
child_units_cte AS (
    SELECT c.master_unit_id,
        jsonb_agg(jsonb_build_object(
            'kiotviet_id', c.kiotviet_id,
            'code', c.code,
            'full_name', c.full_name,
            'unit', c.unit,
            'base_price', c.base_price,
            'conversion_value', c.conversion_value,
            'price_per_master_unit',
                CASE
                    WHEN c.conversion_value > 0 THEN round(c.base_price / c.conversion_value::numeric, 0)
                    ELSE NULL
                END,
            'price_changelog', COALESCE(cl_1.changelog -> 'base_price', '[]'::jsonb)
        )) AS child_unit_info
    FROM kv_products c
    LEFT JOIN changelog_cte cl_1 ON cl_1.kiotviet_id = c.kiotviet_id
    WHERE c.master_unit_id IS NOT NULL
    GROUP BY c.master_unit_id
),
child_price_calc AS (
    SELECT c.master_unit_id,
        jsonb_agg(jsonb_build_object(
            'kiotviet_id', c.kiotviet_id,
            'code', c.code,
            'full_name', c.full_name,
            'unit', c.unit,
            'conversion_value', c.conversion_value,
            'current_baseprice', c.base_price,
            'new_baseprice',
                CASE
                    WHEN c.conversion_value > 0 THEN (lp_2.latest_total_cost_per_unit + COALESCE(p_2.glt_extra_cost, 0) + 2000) * c.conversion_value::numeric
                    ELSE NULL
                END,
            'diff',
                CASE
                    WHEN c.conversion_value > 0 THEN (lp_2.latest_total_cost_per_unit + COALESCE(p_2.glt_extra_cost, 0) + 2000) * c.conversion_value::numeric - c.base_price
                    ELSE NULL
                END,
            'diff_per_cv',
                CASE
                    WHEN c.conversion_value > 0 THEN round(((lp_2.latest_total_cost_per_unit + COALESCE(p_2.glt_extra_cost, 0) + 2000) * c.conversion_value::numeric - c.base_price) / c.conversion_value::numeric, 0)
                    ELSE NULL
                END
        ) ORDER BY c.conversion_value) AS child_unit_prices
    FROM kv_products c
    JOIN latest_po_per_product lp_2 ON lp_2.product_id = c.master_unit_id
    JOIN kv_products p_2 ON p_2.kiotviet_id = c.master_unit_id
    WHERE c.master_unit_id IS NOT NULL AND c.is_active = true
    GROUP BY c.master_unit_id
)
SELECT p.id AS product_id,
    p.kiotviet_id,
    p.code AS product_code,
    p.full_name AS product_name,
    p.base_price,
    p.category_name,
    p.category_id,
    p.glt_baseprice_markup,
    p.glt_extra_cost,
    p.glt_baseprice_round_step,
    p.is_active,
    p.order_template,
    inv.cost AS inventory_cost,
    COALESCE((
        SELECT jsonb_agg(jsonb_build_object('role', ri.role, 'images', ri.images))
        FROM role_images ri
        WHERE ri.product_id = p.kiotviet_id
    ), '[]'::jsonb) AS glt_images,
    p.glt_images_homepage,
    p.glt_images_upload,
    jsonb_build_object(
        'glt_visible', COALESCE(p.glt_visible, true),
        'glt_retail_promotion', COALESCE(p.glt_retail_promotion, false),
        'glt_labelprint_favorite', COALESCE(p.glt_labelprint_favorite, false)
    ) AS glt_custom_fields,
    lp.latest_purchase_order_id,
    lp.latest_total_cost_per_unit,
    lp.latest_purchase_date,
    lp.latest_purchase_order_code,
    CASE
        WHEN lp.latest_total_cost_per_unit IS NOT NULL AND p.base_price > 0 THEN p.base_price - lp.latest_total_cost_per_unit
        ELSE NULL
    END AS latest_price_difference,
    CASE
        WHEN lp.latest_total_cost_per_unit IS NOT NULL AND p.base_price > 0 THEN round((p.base_price - lp.latest_total_cost_per_unit) / p.base_price * 100, 2)
        ELSE NULL
    END AS latest_price_difference_percent,
    CASE
        WHEN inv.cost IS NOT NULL AND lp.latest_total_cost_per_unit IS NOT NULL THEN inv.cost - lp.latest_total_cost_per_unit
        ELSE NULL
    END AS cost_diff_from_latest_po,
    CASE
        WHEN lp.latest_total_cost_per_unit IS NOT NULL THEN ceiling((lp.latest_total_cost_per_unit + COALESCE(p.glt_baseprice_markup, 0)::numeric) / COALESCE(p.glt_baseprice_round_step, 1000)::numeric) * COALESCE(p.glt_baseprice_round_step, 1000)::numeric
        ELSE NULL
    END AS new_baseprice_suggestion,
    COALESCE(cu.child_unit_info, '[]'::jsonb) AS child_unit_info,
    p.images AS kv_images,
    COALESCE(rp.recent_purchases, '[]'::jsonb) AS recent_purchases,
    COALESCE(ps.purchase_stats, 'null'::jsonb) AS purchase_stats,
    COALESCE(cl.changelog, '{}'::jsonb) AS changelog,
    jsonb_build_object(
        'cost_vs_basecost', jsonb_build_object(
            'inventory_cost', inv.cost,
            'basecost_price', bc.price,
            'status',
                CASE
                    WHEN inv.cost IS NULL THEN 'no_inventory_cost'
                    WHEN bc.price IS NULL THEN 'no_basecost_price'
                    WHEN inv.cost = bc.price THEN 'matched'
                    ELSE 'mismatched'
                END,
            'difference',
                CASE
                    WHEN inv.cost IS NOT NULL AND bc.price IS NOT NULL THEN round(inv.cost - bc.price, 2)
                    ELSE NULL
                END
        )
    ) AS kiotviet_status,
    CASE
        WHEN lp.latest_total_cost_per_unit IS NOT NULL OR inv.cost IS NOT NULL THEN jsonb_build_object(
            'cost_diff',
                CASE
                    WHEN inv.cost IS NOT NULL AND lp.latest_total_cost_per_unit IS NOT NULL THEN inv.cost - lp.latest_total_cost_per_unit
                    ELSE NULL
                END,
            'cost_diff_dir',
                CASE
                    WHEN inv.cost IS NOT NULL AND lp.latest_total_cost_per_unit IS NOT NULL THEN
                        CASE
                            WHEN inv.cost > lp.latest_total_cost_per_unit THEN 'up'
                            WHEN inv.cost < lp.latest_total_cost_per_unit THEN 'down'
                            ELSE NULL
                        END
                    ELSE NULL
                END,
            'inventory_cost', inv.cost,
            'latest_po_price', lp.latest_price,
            'latest_po_extra_cost', lp.latest_extra_cost_per_unit,
            'glt_extra_cost', p.glt_extra_cost
        )
        ELSE NULL
    END AS cost_analysis,
    jsonb_build_object(
        'base_price', p.base_price,
        'glt_baseprice_markup', COALESCE(p.glt_baseprice_markup, 0),
        'glt_baseprice_round_step', COALESCE(p.glt_baseprice_round_step, 1000),
        'new_baseprice_suggestion',
            CASE
                WHEN lp.latest_total_cost_per_unit IS NOT NULL THEN ceiling((lp.latest_total_cost_per_unit + COALESCE(p.glt_baseprice_markup, 0)::numeric) / COALESCE(p.glt_baseprice_round_step, 1000)::numeric) * COALESCE(p.glt_baseprice_round_step, 1000)::numeric
                ELSE NULL
            END,
        'child_unit_prices', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'code', cu_elem.value ->> 'code',
                'full_name', cu_elem.value ->> 'full_name',
                'base_price', (cu_elem.value ->> 'base_price')::numeric,
                'conversion_value', (cu_elem.value ->> 'conversion_value')::numeric,
                'price_per_master_unit', (cu_elem.value ->> 'price_per_master_unit')::numeric
            ))
            FROM jsonb_array_elements(COALESCE(cu.child_unit_info, '[]'::jsonb)) cu_elem(value)
        ), '[]'::jsonb)
    ) AS pricing_info,
    CASE
        WHEN lp.latest_total_cost_per_unit IS NOT NULL THEN jsonb_build_object(
            'current_baseprice', p.base_price,
            'current_inventory_cost', inv.cost,
            'latest_purchase_order_id', lp.latest_purchase_order_id,
            'latest_purchase_date', lp.latest_purchase_date,
            'latest_purchase_order_code', lp.latest_purchase_order_code,
            'latest_supplier_name', lp.latest_supplier_name,
            'latest_raw_price', lp.latest_price,
            'latest_base_cost', lp.latest_base_cost_per_unit,
            'latest_extra_cost_per_unit', lp.latest_extra_cost_per_unit,
            'latest_total_cost_per_unit', lp.latest_total_cost_per_unit,
            'product_extra_cost', COALESCE(p.glt_extra_cost, 0),
            'new_cost', lp.latest_total_cost_per_unit + COALESCE(p.glt_extra_cost, 0),
            'new_baseprice', ceiling((lp.latest_total_cost_per_unit + COALESCE(p.glt_extra_cost, 0) + COALESCE(p.glt_baseprice_markup, 0)::numeric) / COALESCE(p.glt_baseprice_round_step, 1000)::numeric) * COALESCE(p.glt_baseprice_round_step, 1000)::numeric,
            'baseprice_diff', ceiling((lp.latest_total_cost_per_unit + COALESCE(p.glt_extra_cost, 0) + COALESCE(p.glt_baseprice_markup, 0)::numeric) / COALESCE(p.glt_baseprice_round_step, 1000)::numeric) * COALESCE(p.glt_baseprice_round_step, 1000)::numeric - p.base_price,
            'child_unit_prices', COALESCE(cpc.child_unit_prices, '[]'::jsonb)
        )
        ELSE NULL
    END AS calculate_from_po
FROM kv_products p
LEFT JOIN kv_product_inventories inv ON inv.product_id = p.id
LEFT JOIN latest_po_per_product lp ON lp.product_id = p.kiotviet_id
LEFT JOIN recent_purchases_cte rp ON rp.product_id = p.kiotviet_id
LEFT JOIN purchase_stats_cte ps ON ps.product_id = p.kiotviet_id
LEFT JOIN child_units_cte cu ON cu.master_unit_id = p.kiotviet_id
LEFT JOIN changelog_cte cl ON cl.kiotviet_id = p.kiotviet_id
LEFT JOIN kv_product_pricebooks bc ON bc.product_id = p.id AND bc.pricebook_id = 7598
LEFT JOIN child_price_calc cpc ON cpc.master_unit_id = p.kiotviet_id
WHERE p.master_unit_id IS NULL AND COALESCE(p.is_deleted, false) = false;

COMMENT ON VIEW v_products_admin IS 'Admin products view. Image URLs point to Supabase Storage (product-images bucket); rev included for cache-busting.';
