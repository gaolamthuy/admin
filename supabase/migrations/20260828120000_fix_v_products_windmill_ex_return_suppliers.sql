-- Migration: Fix v_products_windmill extra-cost formula (include ex_return_suppliers)
--
-- Bug: v_products_windmill (used by windmill scripts: update_product_price_from_po,
-- create_purchase_order, generate_price_card_image, print flows) computed
-- glt_extra_cost_per_unit from ex_return_third_party only, ignoring
-- ex_return_suppliers. v_products_admin already had the fixed formula.
--
-- Effect: latest_total_cost_per_unit / new_cost / new_baseprice / child prices
-- were understated for POs that carry supplier-return surcharges
-- (e.g. PN000721 ST25: 34,500 -> 36,200/kg, baseprice 39,000 -> 41,000,
-- child bao 25kg 912,500 -> 955,000).
--
-- This view is DB-managed (not in any prior migration); this migration pins
-- the current full definition with the fix so it is tracked from now on.

CREATE OR REPLACE VIEW v_products_windmill AS
WITH po_totals AS (
         SELECT kv_purchase_order_details.purchase_order_id,
            sum(kv_purchase_order_details.quantity) AS total_qty
           FROM kv_purchase_order_details
          GROUP BY kv_purchase_order_details.purchase_order_id
        ), purchase_order_totals AS (
         SELECT pod.product_id,
            pod.purchase_order_id,
            pod.quantity,
            pod.price,
            pod.discount,
            po.purchase_date,
            po.code AS purchase_order_code,
            po.supplier_name,
                CASE
                    WHEN pod.quantity > 0::numeric THEN pod.quantity * pod.price * (1::numeric - COALESCE(pod.discount, 0::numeric) / 100::numeric) / pod.quantity
                    ELSE 0::numeric
                END AS base_cost_per_unit,
            round(
                CASE
                    WHEN COALESCE(pt.total_qty, 0::numeric) > 0::numeric THEN (po.ex_return_third_party + COALESCE(po.ex_return_suppliers, 0)) / pt.total_qty
                    ELSE 0::numeric
                END, '-2'::integer) AS glt_extra_cost_per_unit,
                CASE
                    WHEN pod.quantity > 0::numeric THEN pod.quantity * pod.price * (1::numeric - COALESCE(pod.discount, 0::numeric) / 100::numeric) / pod.quantity
                    ELSE 0::numeric
                END + round(
                CASE
                    WHEN COALESCE(pt.total_qty, 0::numeric) > 0::numeric THEN (po.ex_return_third_party + COALESCE(po.ex_return_suppliers, 0)) / pt.total_qty
                    ELSE 0::numeric
                END, '-2'::integer) AS total_cost_per_unit
           FROM kv_purchase_order_details pod
             JOIN kv_purchase_orders po ON po.id = pod.purchase_order_id
             LEFT JOIN po_totals pt ON pt.purchase_order_id = pod.purchase_order_id
          WHERE po.status = 3
        ), latest_po_per_product AS (
         SELECT DISTINCT ON (purchase_order_totals.product_id) purchase_order_totals.product_id,
            purchase_order_totals.purchase_order_id AS latest_purchase_order_id,
            purchase_order_totals.purchase_date AS latest_purchase_date,
            purchase_order_totals.purchase_order_code AS latest_purchase_order_code,
            purchase_order_totals.base_cost_per_unit AS latest_base_cost,
            purchase_order_totals.glt_extra_cost_per_unit AS latest_extra_cost_per_unit,
            purchase_order_totals.total_cost_per_unit AS latest_total_cost_per_unit,
            purchase_order_totals.price AS latest_raw_price,
            purchase_order_totals.supplier_name AS latest_supplier_name
           FROM purchase_order_totals
          ORDER BY purchase_order_totals.product_id, purchase_order_totals.purchase_date DESC
        ), child_units_cte AS (
         SELECT c.master_unit_id,
            jsonb_agg(jsonb_build_object('kiotviet_id', c.kiotviet_id, 'code', c.code, 'full_name', c.full_name, 'unit', c.unit, 'base_price', c.base_price, 'conversion_value', c.conversion_value, 'price_per_master_unit',
                CASE
                    WHEN c.conversion_value > 0 THEN round(c.base_price / c.conversion_value::numeric, 0)
                    ELSE NULL::numeric
                END, 'allows_sale', c.allows_sale)) AS child_unit_info
           FROM kv_products c
          WHERE c.master_unit_id IS NOT NULL AND c.is_active = true
          GROUP BY c.master_unit_id
        ), child_price_calc AS (
         SELECT c.master_unit_id,
            jsonb_agg(jsonb_build_object('kiotviet_id', c.kiotviet_id, 'code', c.code, 'full_name', c.full_name, 'unit', c.unit, 'conversion_value', c.conversion_value, 'new_baseprice',
                CASE
                    WHEN c.conversion_value > 0 THEN (lp_1.latest_total_cost_per_unit + COALESCE(p_1.glt_extra_cost, 0::numeric) + 2000::numeric) * c.conversion_value::numeric
                    ELSE NULL::numeric
                END) ORDER BY c.conversion_value) AS child_unit_prices
           FROM kv_products c
             JOIN latest_po_per_product lp_1 ON lp_1.product_id = c.master_unit_id
             JOIN kv_products p_1 ON p_1.kiotviet_id = c.master_unit_id
          WHERE c.master_unit_id IS NOT NULL AND c.is_active = true
          GROUP BY c.master_unit_id
        ), glt_image_by_type AS (
         SELECT glt_product_images.product_id,
            glt_product_images.role,
            jsonb_object_agg(glt_product_images.image_type, jsonb_build_object('public_url', (('https://wvckxasjbydyvqgwgdhg.supabase.co/storage/v1/object/public/product-images/'::text || glt_product_images.path) || '?t='::text) || glt_product_images.rev, 'updated_at', to_char(to_timestamp((glt_product_images.rev / 1000)::double precision), 'DD/MM/YYYY HH24:MI:SS'::text), 'thumbnail_url',
                CASE
                    WHEN glt_product_images.image_type = ANY (ARRAY['original'::text, 'display'::text]) THEN (('https://imagor.hophamlam.com/unsafe/fit-in/300x400/filters:format(webp):quality(80)/wvckxasjbydyvqgwgdhg.supabase.co/storage/v1/object/public/product-images/'::text || glt_product_images.path) || '?t='::text) || glt_product_images.rev
                    ELSE NULL::text
                END)) AS images
           FROM glt_product_images
          GROUP BY glt_product_images.product_id, glt_product_images.role
        ), glt_images_agg AS (
         SELECT glt_image_by_type.product_id,
            jsonb_object_agg(glt_image_by_type.role, glt_image_by_type.images) AS glt_images
           FROM glt_image_by_type
          GROUP BY glt_image_by_type.product_id
        ), price_change_latest AS (
         SELECT DISTINCT ON (glt_product_changelogs.kiotviet_id) glt_product_changelogs.kiotviet_id,
            glt_product_changelogs.created_at AS price_updated_at
           FROM glt_product_changelogs
          WHERE glt_product_changelogs.field = 'base_price'::text
          ORDER BY glt_product_changelogs.kiotviet_id, glt_product_changelogs.created_at DESC
        )
 SELECT p.id AS product_id,
    p.kiotviet_id,
    p.code AS product_code,
    p.full_name AS product_name,
    p.glt_supplier_name,
    p.base_price,
    p.category_name,
    p.category_id,
    p.unit,
    p.is_active,
    p.glt_baseprice_markup,
    p.glt_extra_cost,
    p.glt_visible,
    p.glt_retail_promotion,
    p.glt_labelprint_favorite,
    p.order_template,
    p.description,
    p.images AS kv_images,
    inv.cost AS inventory_cost,
    inv.cost + COALESCE(p.glt_extra_cost, 0::numeric) AS total_cost,
    COALESCE(cu.child_unit_info, '[]'::jsonb) AS child_unit_info,
        CASE
            WHEN lp.latest_total_cost_per_unit IS NOT NULL THEN jsonb_build_object('latest_purchase_order_id', lp.latest_purchase_order_id, 'latest_purchase_date', lp.latest_purchase_date, 'latest_purchase_order_code', lp.latest_purchase_order_code, 'latest_supplier_name', lp.latest_supplier_name, 'latest_raw_price', lp.latest_raw_price, 'latest_base_cost', lp.latest_base_cost, 'latest_extra_cost_per_unit', lp.latest_extra_cost_per_unit, 'latest_total_cost_per_unit', lp.latest_total_cost_per_unit, 'product_extra_cost', COALESCE(p.glt_extra_cost, 0::numeric), 'new_cost', lp.latest_total_cost_per_unit + COALESCE(p.glt_extra_cost, 0::numeric), 'new_baseprice', ceiling((lp.latest_total_cost_per_unit + COALESCE(p.glt_extra_cost, 0::numeric) + COALESCE(p.glt_baseprice_markup, 0)::numeric) / COALESCE(p.glt_baseprice_round_step, 1000)::numeric) * COALESCE(p.glt_baseprice_round_step, 1000)::numeric, 'child_unit_prices', COALESCE(cpc.child_unit_prices, '[]'::jsonb))
            ELSE NULL::jsonb
        END AS calculate_from_po,
    p.glt_baseprice_round_step,
    COALESCE(gia.glt_images, '{}'::jsonb) AS glt_images,
    pcl.price_updated_at,
    cat.rank AS category_rank,
    cat.glt_color_border AS primary_color
   FROM kv_products p
     LEFT JOIN kv_product_inventories inv ON inv.product_id = p.id
     LEFT JOIN child_units_cte cu ON cu.master_unit_id = p.kiotviet_id
     LEFT JOIN latest_po_per_product lp ON lp.product_id = p.kiotviet_id
     LEFT JOIN child_price_calc cpc ON cpc.master_unit_id = p.kiotviet_id
     LEFT JOIN glt_images_agg gia ON gia.product_id = p.kiotviet_id
     LEFT JOIN price_change_latest pcl ON pcl.kiotviet_id = p.kiotviet_id
     JOIN kv_product_categories cat ON cat.category_id = p.category_id
  WHERE p.master_unit_id IS NULL AND COALESCE(p.is_deleted, false) = false AND p.is_active = true AND COALESCE(p.allows_sale, false) = true AND COALESCE(cat.glt_is_active, false) = true;;