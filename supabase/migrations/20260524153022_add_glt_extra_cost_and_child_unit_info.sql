-- Migration: add glt_extra_cost to kv_products + child_unit_info to v_products_admin

-- 1. Add glt_extra_cost column to kv_products
ALTER TABLE kv_products ADD COLUMN IF NOT EXISTS glt_extra_cost NUMERIC DEFAULT 0;

-- 2. Recreate v_products_admin with new fields: glt_extra_cost, child_unit_info
CREATE OR REPLACE VIEW v_products_admin AS
WITH po_totals AS (
    SELECT
        kv_purchase_order_details.purchase_order_id,
        sum(kv_purchase_order_details.quantity) AS total_qty
    FROM kv_purchase_order_details
    GROUP BY kv_purchase_order_details.purchase_order_id
),
purchase_order_totals AS (
    SELECT
        pod.product_id,
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
                WHEN COALESCE(pt.total_qty, 0) > 0 THEN po.ex_return_third_party / pt.total_qty
                ELSE 0
            END, -2
        ) AS glt_extra_cost_per_unit,
        CASE
            WHEN pod.quantity > 0 THEN pod.quantity * pod.price * (1 - COALESCE(pod.discount, 0) / 100) / pod.quantity
            ELSE 0
        END + round(
            CASE
                WHEN COALESCE(pt.total_qty, 0) > 0 THEN po.ex_return_third_party / pt.total_qty
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
        purchase_order_totals.price AS latest_price
    FROM purchase_order_totals
    ORDER BY purchase_order_totals.product_id, purchase_order_totals.purchase_date DESC
),
recent_purchases_cte AS (
    SELECT
        ranked.product_id,
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
        SELECT
            pot.product_id,
            pot.purchase_order_id,
            pot.quantity,
            pot.price,
            pot.discount,
            pot.purchase_date,
            pot.purchase_order_code,
            pot.supplier_name,
            pot.total_cost_per_unit,
            pot.glt_extra_cost_per_unit,
            row_number() OVER (PARTITION BY pot.product_id ORDER BY pot.purchase_date DESC) AS rn
        FROM purchase_order_totals pot
    ) ranked
    WHERE ranked.rn <= 5
    GROUP BY ranked.product_id
),
purchase_stats_cte AS (
    SELECT
        pot.product_id,
        jsonb_build_object(
            'avg_price', avg(pot.price),
            'avg_total_cost', avg(pot.total_cost_per_unit),
            'min_price', min(pot.price),
            'max_price', max(pot.price),
            'latest_price', lp.latest_price,
            'latest_total_cost', lp.latest_total_cost_per_unit,
            'total_quantity', sum(pot.quantity),
            'purchase_count', count(*)
        ) AS purchase_stats
    FROM purchase_order_totals pot
    LEFT JOIN latest_po_per_product lp ON lp.product_id = pot.product_id
    GROUP BY pot.product_id, lp.latest_price, lp.latest_total_cost_per_unit
),
role_images AS (
    SELECT
        glt_product_images.product_id,
        glt_product_images.role,
        jsonb_object_agg(
            glt_product_images.image_type ||
            CASE WHEN glt_product_images.is_thumbnail THEN '_thumbnail' ELSE '' END,
            jsonb_build_object(
                'id', glt_product_images.id,
                'path', glt_product_images.path,
                'url', 'https://cdn.gaolamthuy.vn/' || glt_product_images.path,
                'width', glt_product_images.width,
                'height', glt_product_images.height,
                'format', glt_product_images.format
            )
        ) AS images
    FROM glt_product_images
    GROUP BY glt_product_images.product_id, glt_product_images.role
),
child_units_cte AS (
    SELECT
        c.master_unit_id,
        jsonb_agg(jsonb_build_object(
            'kiotviet_id', c.kiotviet_id,
            'code', c.code,
            'full_name', c.full_name,
            'unit', c.unit,
            'base_price', c.base_price,
            'conversion_value', c.conversion_value,
            'price_per_master_unit', CASE
                WHEN c.conversion_value > 0 THEN round(c.base_price / c.conversion_value, 0)
                ELSE NULL
            END
        )) AS child_unit_info
    FROM kv_products c
    WHERE c.master_unit_id IS NOT NULL
    GROUP BY c.master_unit_id
)
SELECT
    p.id AS product_id,
    p.kiotviet_id,
    p.code AS product_code,
    p.full_name AS product_name,
    p.base_price,
    p.category_name,
    p.category_id,
    p.glt_baseprice_markup,
    p.glt_extra_cost,
    p.is_active,
    inv.cost AS inventory_cost,
    COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('role', ri.role, 'images', ri.images))
         FROM role_images ri WHERE ri.product_id = p.kiotviet_id),
        '[]'::jsonb
    ) AS glt_images,
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
        WHEN lp.latest_total_cost_per_unit IS NOT NULL AND p.base_price > 0
        THEN p.base_price - lp.latest_total_cost_per_unit
        ELSE NULL
    END AS latest_price_difference,
    CASE
        WHEN lp.latest_total_cost_per_unit IS NOT NULL AND p.base_price > 0
        THEN round((p.base_price - lp.latest_total_cost_per_unit) / p.base_price * 100, 2)
        ELSE NULL
    END AS latest_price_difference_percent,
    CASE
        WHEN inv.cost IS NOT NULL AND lp.latest_total_cost_per_unit IS NOT NULL
        THEN inv.cost - lp.latest_total_cost_per_unit
        ELSE NULL
    END AS cost_diff_from_latest_po,
    CASE
        WHEN lp.latest_total_cost_per_unit IS NOT NULL
        THEN lp.latest_total_cost_per_unit + COALESCE(p.glt_baseprice_markup, 0)::numeric
        ELSE NULL
    END AS new_baseprice_suggestion,
    COALESCE(cu.child_unit_info, '[]'::jsonb) AS child_unit_info,
    p.images AS kv_images,
    COALESCE(rp.recent_purchases, '[]'::jsonb) AS recent_purchases,
    COALESCE(ps.purchase_stats, 'null'::jsonb) AS purchase_stats
FROM kv_products p
LEFT JOIN kv_product_inventories inv ON inv.product_id = p.id
LEFT JOIN latest_po_per_product lp ON lp.product_id = p.kiotviet_id
LEFT JOIN recent_purchases_cte rp ON rp.product_id = p.kiotviet_id
LEFT JOIN purchase_stats_cte ps ON ps.product_id = p.kiotviet_id
LEFT JOIN child_units_cte cu ON cu.master_unit_id = p.kiotviet_id
WHERE p.master_unit_id IS NULL
  AND COALESCE(p.is_deleted, false) = false;
