import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Text, Card, Button } from "antd";

interface Promotion {
  id: number;
  kiotviet_customer_group: string | null;
  discount_per_unit: number;
  note: string | null;
  valid_from: string | null;
  valid_to: string | null;
  unit_applied: string | null;
  apply_per: number;
  title: string | null;
}

const MainPOS: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activePromotions, setActivePromotions] = useState<number[]>([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      console.log("[PROMO DEBUG] ➡️ start fetching promotions…");
      const now = new Date().toISOString();
      const { data, error, status, statusText } = await supabase
        .from("glt_promotions")
        .select("*")
        .lte("valid_from", now)
        .gte("valid_to", now);
      console.log("[PROMO DEBUG] status:", status, statusText);
      console.log("[PROMO DEBUG] data:", data);
      console.log("[PROMO DEBUG] error:", error);
      if (!error && data) {
        setPromotions(data);
      }
    };
    fetchPromotions();
  }, []);

  // Debug: test fetch promotions
  useEffect(() => {
    (async () => {
      console.log("[PROMO DEBUG] start fetch");
      const { data, error, status, statusText } = await supabase
        .from("glt_promotions")
        .select("*");
      console.log("[PROMO DEBUG] status:", status, statusText);
      console.log("[PROMO DEBUG] data:", data);
      console.log("[PROMO DEBUG] error:", error);
      // nếu muốn lưu vào state:
      if (!error && data) setPromotions(data);
    })();
  }, []);

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    let discount = 0;

    cart.forEach((item) => {
      console.log(
        "Item:",
        item.name,
        "Unit:",
        item.unit,
        "Qty:",
        item.quantity
      );
      promotions.forEach((p) => {
        const inGroup =
          !p.kiotviet_customer_group ||
          p.kiotviet_customer_group === customer?.groups;
        const inUnit =
          !p.unit_applied ||
          p.unit_applied.toLowerCase() === item.unit.toLowerCase();
        const inQty = item.quantity >= p.min_quantity;

        console.log(
          "Testing promo:",
          p.id,
          "inGroup=",
          inGroup,
          "inUnit=",
          inUnit,
          "inQty=",
          inQty
        );

        if (inGroup && inUnit && inQty) {
          discount += p.discount_amount;
        }
      });
    });

    return subtotal - discount;
  };

  const calculateDiscount = () => {
    let totalDiscount = 0;

    cart.forEach((item) => {
      // Chỉ xét các khuyến mãi đang active
      const applicablePromos = promotions.filter(
        (p) =>
          activePromotions.includes(p.id) &&
          (!p.kiotviet_customer_group ||
            p.kiotviet_customer_group === customer?.groups) &&
          (!p.unit_applied ||
            p.unit_applied.toLowerCase() === item.unit.toLowerCase())
      );

      applicablePromos.forEach((promo) => {
        // Tính số lần áp dụng khuyến mãi
        const applicableUnits = Math.floor(item.quantity / promo.apply_per);
        // Tính discount cho item này
        const itemDiscount = applicableUnits * promo.discount_per_unit;
        totalDiscount += itemDiscount;

        if (itemDiscount > 0) {
          console.log(
            `[PROMO] Applied: ${
              promo.title || promo.note || "Discount"
            } (-${itemDiscount}) to ${item.name}`
          );
        }
      });
    });

    return totalDiscount;
  };

  // Toggle khuyến mãi khi người dùng nhấn nút
  const togglePromotion = (promoId: number) => {
    setActivePromotions((prev) => {
      if (prev.includes(promoId)) {
        return prev.filter((id) => id !== promoId);
      } else {
        return [...prev, promoId];
      }
    });
  };

  const PromotionsCard = () => {
    if (promotions.length === 0) return null;
    
    return (
      <Card title="Chương trình khuyến mãi" size="small" style={{ marginBottom: 16 }}>
        {promotions.map(promo => (
          <div key={promo.id} style={{...}}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{promo.title || 'Khuyến mãi'}</div>
              <div style={{ fontSize: '12px' }}>
                {promo.note && <span>{promo.note}<br/></span>}
                <span>
                  Giảm {promo.discount_per_unit.toLocaleString()}đ/{promo.apply_per} {promo.unit_applied || 'đơn vị'}
                  {promo.kiotviet_customer_group && ` (${promo.kiotviet_customer_group})`}
                </span>
              </div>
            </div>
            <Button 
              type={activePromotions.includes(promo.id) ? "primary" : "default"}
              size="small"
              onClick={() => togglePromotion(promo.id)}
            >
              {activePromotions.includes(promo.id) ? "Đang áp dụng" : "Đã tắt"}
            </Button>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: '14px' }}>
          Tổng giảm giá: <Text strong>{calculateDiscount().toLocaleString()} VND</Text>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ background: "#f0f0f0", padding: 8, margin: "10px 0" }}>
      <div>
        Subtotal: {cart.reduce((s, i) => s + i.total, 0).toLocaleString()} VND
      </div>
      <div>Discount: {calculateDiscount().toLocaleString()} VND</div>
      <div>Final: {calculateTotal().toLocaleString()} VND</div>
      <div>Active Promos: {promotions.length}</div>
      {/* Promotions Card */}
      {promotions.length > 0 && <PromotionsCard />}
    </div>
  );
};

export default MainPOS;
