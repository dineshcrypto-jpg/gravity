import { CartItem } from "@/context/CartContext";
import { supabase } from "./supabase";

export const saveOrderToSupabase = async (
  userId: string | null | undefined, 
  items: CartItem[], 
  total: number, 
  customerInfo: { name: string, phone: string, address: string, landmark: string }
) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId || null,
        items: items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          variety_id: item.variety.id,
          variety_label: item.variety.label,
          price: item.variety.price,
          quantity: item.quantity
        })),
        total: total,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        customer_landmark: customerInfo.landmark,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to save order to database:", error);
    throw new Error("Database Error: " + (error.message || "Unknown error"));
  }
};

export const getWhatsAppLink = (phoneNumber: string, items: CartItem[], total: number, customerInfo: { name: string, phone: string, address: string, landmark: string }) => {
  const customerName = customerInfo.name ? customerInfo.name.toUpperCase() : "CUSTOMER";
  let message = ``;
message += `*Date:* ${new Date().toLocaleDateString("en-IN")}\n\n`;
  
  message += `*CUSTOMER DETAILS:* \n`;
  message += `*Name:* ${customerInfo.name}\n`;
  message += `*Phone:* ${customerInfo.phone}\n`;
  message += `*Address:* ${customerInfo.address}\n`;
  if (customerInfo.landmark) {
    message += `*Landmark:* ${customerInfo.landmark}\n`;
  }
  message += `\n`;

  message += `*ITEMS:* \n`;
  items.forEach((item, index) => {
    message += `${index + 1}. ${item.product.name} (${item.variety.label}) x ${item.quantity} = Rs. ${(item.variety.price * item.quantity).toLocaleString("en-IN")}\n`;
  });
  
  message += `\n*TOTAL AMOUNT: Rs. ${total.toLocaleString("en-IN")}*\n\n`;
  message += `_Please confirm my order._`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};




