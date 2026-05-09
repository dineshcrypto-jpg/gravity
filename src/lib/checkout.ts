import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CartItem } from "@/context/CartContext";
import { supabase } from "./supabase";

export const generateAndDownloadInvoice = (items: CartItem[], total: number, customerInfo: { name: string, phone: string, address: string, landmark: string }) => {
  try {
    const doc = new jsPDF();
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const date = new Date().toLocaleDateString("en-IN", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // --- Header Background (Gradient inspired by photo) ---
    doc.setFillColor(0, 128, 128); // Teal
    doc.rect(0, 0, 100, 60, 'F');
    doc.setFillColor(152, 192, 29); // Lime-Yellow
    doc.rect(100, 0, 60, 60, 'F');
    doc.setFillColor(214, 74, 30); // Orange-Red
    doc.rect(160, 0, 50, 60, 'F');

    // --- Brand Logo (Detailed K.S.N Aruva style - Scaled Down) ---
    const s = 0.14; // Scale factor
    const ox = 8;
    const oy = 5;

    doc.setFillColor(0, 0, 0);
    // The sharp curved blade
    doc.lines(
      [
        [0, -130],
        [0, -30, -20, -50, -40, -50],
        [30, -10, 60, 10, 60, 50],
        [0, 130]
      ],
      ox + 50 * s, oy + 200 * s,
      [s, s],
      'F',
      true
    );

    // The decorative ridges on the neck
    doc.roundedRect(ox + 45*s, oy + 200*s, 30*s, 6*s, 2*s, 2*s, 'F');
    doc.roundedRect(ox + 42*s, oy + 210*s, 36*s, 6*s, 2*s, 2*s, 'F');
    doc.roundedRect(ox + 45*s, oy + 220*s, 30*s, 6*s, 2*s, 2*s, 'F');

    // The pedestal base
    doc.lines(
      [
        [60, 0],
        [-10, 15],
        [-40, 0]
      ],
      ox + 30 * s, oy + 230 * s,
      [s, s],
      'F',
      true
    );

    // Three Vibuthi lines with Kungumam dots
    doc.setFillColor(255, 255, 255);
    doc.rect(ox + 52*s, oy + 85*s, 16*s, 3*s, 'F');
    doc.rect(ox + 52*s, oy + 115*s, 16*s, 3*s, 'F');
    doc.rect(ox + 52*s, oy + 145*s, 16*s, 3*s, 'F');

    doc.setFillColor(239, 68, 68);
    doc.circle(ox + 60*s, oy + 86.5*s, 2*s, 'F');
    doc.circle(ox + 60*s, oy + 116.5*s, 2*s, 'F');
    doc.circle(ox + 60*s, oy + 146.5*s, 2*s, 'F');

    doc.setFontSize(22);
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(0, 0, 0);
    doc.text("K.S.N", 22, 22);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("SUPER STORE", 22, 28);



    // --- Store Info (White on Dark) ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("1/C6, Rajan Complex, Forest Main Road, Theni.", 14, 50);
    doc.text("GST: 33CALPP2600JIZT | TIN: 33225183020", 14, 54);


    // --- Invoice Label ---
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("INVOICE", 140, 25);

    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`, 140, 35);
    doc.text(`Date: ${date}`, 140, 40);


    // --- Customer Section ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("BILL TO:", 14, 75);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(customerInfo.name || "Valued Customer", 14, 82);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Phone: ${customerInfo.phone}`, 14, 87);
    
    const splitAddress = doc.splitTextToSize(customerInfo.address, 80);
    doc.text(splitAddress, 14, 92);
    
    if (customerInfo.landmark) {
      doc.setFont("helvetica", "bold");
      doc.text(`Landmark: ${customerInfo.landmark}`, 14, 92 + (splitAddress.length * 5));
    }

    // --- Table ---
    const tableColumn = ["#", "Item Description", "Qty", "Price", "Amount"];
    const tableRows = items.map((item, index) => [
      (index + 1).toString(),
      `${item.product.name}\n(${item.variety.label})`,
      item.quantity.toString(),
      `Rs. ${item.variety.price.toLocaleString("en-IN")}`,
      `Rs. ${(item.variety.price * item.quantity).toLocaleString("en-IN")}`
    ]);

    autoTable(doc, {
      startY: 115,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 128, 128], 
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 5,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 90 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: 14, right: 14 }
    });

    // --- Summary ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFillColor(249, 250, 251);
    doc.rect(130, finalY - 5, 66, 35, 'F');

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Subtotal:", 135, finalY + 5);
    doc.text(`Rs. ${total.toLocaleString("en-IN")}`, 190, finalY + 5, { align: 'right' });
    
    doc.text("Tax (0%):", 135, finalY + 12);
    doc.text("Rs. 0", 190, finalY + 12, { align: 'right' });

    doc.setLineWidth(0.1);
    doc.setDrawColor(200, 200, 200);
    doc.line(135, finalY + 16, 190, finalY + 16);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(214, 74, 30);
    doc.text("Grand Total:", 135, finalY + 23);
    doc.text(`Rs. ${total.toLocaleString("en-IN")}`, 190, finalY + 23, { align: 'right' });

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for shopping at KSN Super Store!", 105, pageHeight - 15, { align: 'center' });
    doc.text("© 2026 KSN Super Store. All Rights Reserved.", 105, pageHeight - 10, { align: 'center' });

    // Save the PDF
    doc.save(`${invoiceNumber}.pdf`);
    
    return invoiceNumber;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

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
  } catch (error: any) {
    console.error("Failed to save order to database:", error);
    throw new Error("Database Error: " + (error.message || "Unknown error"));
  }
};

export const getWhatsAppLink = (phoneNumber: string, items: CartItem[], total: number, invoiceNumber: string, customerInfo: { name: string, phone: string, address: string, landmark: string }) => {
  const customerName = customerInfo.name ? customerInfo.name.toUpperCase() : "CUSTOMER";
  let message = `*NEW ORDER FROM ${customerName}* 🛒\n\n`;
  message += `*Invoice #:* ${invoiceNumber}\n`;
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
  message += `---------------------------\n`;
  message += `_I have downloaded the PDF invoice. Please confirm my order._`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};




