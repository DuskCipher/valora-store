"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, Minus, Plus } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import styles from "./CartDrawer.module.css";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { cart, removeFromCart, addToCart, decreaseQuantity, totalCartPrice } = useStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(price).replace(/\s/g, "");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your Shopping Cart</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {cart.length === 0 ? (
            <div className={styles.emptyCart}>Your cart is empty.</div>
          ) : (
            cart.map((item) => (
              <div key={`${item.product.id}-${item.variation?.id || 'main'}`} className={styles.cartItem}>
                <button className={styles.removeBtn} onClick={() => removeFromCart(item.product.id, item.variation?.id)}>
                  <X size={16} />
                </button>
                <img src={item.product.images[0]} alt={item.product.name} className={styles.itemImg} />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.product.name}</div>
                  {item.variation && (
                    <div className={styles.itemSeller} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      Variant: {item.variation.name}
                    </div>
                  )}
                  <div className={styles.itemSeller}>By : {item.product.seller.name}</div>
                  <div className={styles.itemBottomRow}>
                    <span className={styles.itemPrice}>
                      {formatPrice(item.variation ? (item.variation.discount_price ?? item.variation.price) : item.product.price)}
                    </span>
                    <div className={styles.quantityControls}>
                      <button className={styles.qtyBtn} onClick={() => decreaseQuantity(item.product.id, item.variation?.id)}>
                        <Minus size={14} />
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => addToCart(item.product, item.variation)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.subtotalRow}>
            <span className={styles.subtotalLabel}>Subtotal:</span>
            <span className={styles.subtotalValue}>{formatPrice(totalCartPrice)}</span>
          </div>
          <button className={styles.checkoutBtn} onClick={() => { onClose(); router.push("/checkout"); }}>
            Proceed Checkout
          </button>
        </div>
      </div>
    </>
  );
};
