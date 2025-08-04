import { Order } from "@/utils/models/Order";

export function generateOrderConfirmationEmail(
  order: Order,
  language: string = "en"
) {
  const isEnglish = language === "en";

  const subject = isEnglish
    ? `Order Confirmation #${order.orderReference}`
    : `訂單確認 #${order.orderReference}`;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const itemsList = order.items
    .map(
      (item: any) => `
    ${item.id.displayNames?.[language] || item.id.name}
    ${isEnglish ? "Quantity" : "數量"}: ${item.quantity}
    ${isEnglish ? "Price" : "價格"}: ${formatCurrency(
        item.id.price * item.quantity
      )}
  `
    )
    .join("\\n");

  const text = isEnglish
    ? `
Thank you for your order!

Order Details:
Order Reference: ${order.orderReference}
Status: ${order.status}
Date: ${new Date(order.createdAt).toLocaleDateString()}

Items:
${itemsList}

Subtotal: ${formatCurrency(order.subtotal)}
Delivery Cost: ${formatCurrency(order.deliveryCost)}
Total: ${formatCurrency(order.total)}

Shipping Address:
${order.shippingAddress.en}

Payment Method: ${
        order.paymentMethod === "offline" ? "Bank Transfer" : "Credit Card"
      }

We will process your order shortly. You can track your order status in your account dashboard.

If you have any questions, please don't hesitate to contact us.

Best regards,
Your Store Team
`
    : `
感謝您的訂購！

訂單詳情：
訂單編號：${order.orderReference}
狀態：${order.status}
日期：${new Date(order.createdAt).toLocaleDateString()}

商品：
${itemsList}

小計：${formatCurrency(order.subtotal)}
運費：${formatCurrency(order.deliveryCost)}
總計：${formatCurrency(order.total)}

送貨地址：
${order.shippingAddress["zh-TW"]}

付款方式：${order.paymentMethod === "offline" ? "銀行轉帳" : "信用卡"}

我們將盡快處理您的訂單。您可以在帳戶儀表板中追蹤訂單狀態。

如有任何問題，請隨時與我們聯繫。

順祝 安好
您的商店團隊
`;

  const html = isEnglish
    ? `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .order-details { margin: 20px 0; }
    .items { margin: 20px 0; }
    .item { margin: 10px 0; padding: 10px; background: #f9f9f9; }
    .totals { margin: 20px 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
      <p>Thank you for your order!</p>
    </div>

    <div class="order-details">
      <h2>Order Details</h2>
      <p><strong>Order Reference:</strong> ${order.orderReference}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Date:</strong> ${new Date(
        order.createdAt
      ).toLocaleDateString()}</p>
    </div>

    <div class="items">
      <h2>Items</h2>
      ${order.items
        .map(
          (item: any) => `
        <div class="item">
          <p><strong>${item.id.displayNames?.en || item.id.name}</strong></p>
          <p>Quantity: ${item.quantity}</p>
          <p>Price: ${formatCurrency(item.id.price * item.quantity)}</p>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="totals">
      <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
      <p><strong>Delivery Cost:</strong> ${formatCurrency(
        order.deliveryCost
      )}</p>
      <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
    </div>

    <div class="shipping">
      <h2>Shipping Address</h2>
      <p>${order.shippingAddress.en}</p>
    </div>

    <div class="payment">
      <h2>Payment Method</h2>
      <p>${
        order.paymentMethod === "offline" ? "Bank Transfer" : "Credit Card"
      }</p>
    </div>

    <div class="footer">
      <p>We will process your order shortly. You can track your order status in your account dashboard.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>Your Store Team</p>
    </div>
  </div>
</body>
</html>
`
    : `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .order-details { margin: 20px 0; }
    .items { margin: 20px 0; }
    .item { margin: 10px 0; padding: 10px; background: #f9f9f9; }
    .totals { margin: 20px 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>訂單確認</h1>
      <p>感謝您的訂購！</p>
    </div>

    <div class="order-details">
      <h2>訂單詳情</h2>
      <p><strong>訂單編號：</strong> ${order.orderReference}</p>
      <p><strong>狀態：</strong> ${order.status}</p>
      <p><strong>日期：</strong> ${new Date(
        order.createdAt
      ).toLocaleDateString()}</p>
    </div>

    <div class="items">
      <h2>商品</h2>
      ${order.items
        .map(
          (item: any) => `
        <div class="item">
          <p><strong>${
            item.id.displayNames?.["zh-TW"] || item.id.name
          }</strong></p>
          <p>數量：${item.quantity}</p>
          <p>價格：${formatCurrency(item.id.price * item.quantity)}</p>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="totals">
      <p><strong>小計：</strong> ${formatCurrency(order.subtotal)}</p>
      <p><strong>運費：</strong> ${formatCurrency(order.deliveryCost)}</p>
      <p><strong>總計：</strong> ${formatCurrency(order.total)}</p>
    </div>

    <div class="shipping">
      <h2>送貨地址</h2>
      <p>${order.shippingAddress["zh-TW"]}</p>
    </div>

    <div class="payment">
      <h2>付款方式</h2>
      <p>${order.paymentMethod === "offline" ? "銀行轉帳" : "信用卡"}</p>
    </div>

    <div class="footer">
      <p>我們將盡快處理您的訂單。您可以在帳戶儀表板中追蹤訂單狀態。</p>
      <p>如有任何問題，請隨時與我們聯繫。</p>
      <p>順祝 安好<br>您的商店團隊</p>
    </div>
  </div>
</body>
</html>
`;

  return {
    subject,
    text,
    html,
  };
}
