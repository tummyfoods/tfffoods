export default function printInvoice(invoice: any) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const content = `
    <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          @media print {
            body { margin: 20px; font-family: system-ui; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; }
            th { border-bottom: 1px solid #000; }
            tr { border-bottom: 1px solid #eee; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <img src="/logo.png" alt="Logo" style="width: 150px; height: 50px;" />
            <h1>Invoice</h1>
          </div>
          <div style="text-align: right;">
            <p style="font-weight: bold;">${invoice.invoiceNumber}</p>
            <p>${new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2>Customer Information</h2>
          <p><strong>Name:</strong> ${invoice.user.name}</p>
          <p><strong>Email:</strong> ${invoice.user.email}</p>
          ${
            invoice.user.phone
              ? `<p><strong>Phone:</strong> ${invoice.user.phone}</p>`
              : ""
          }
        </div>

        ${
          invoice.invoiceType === "period"
            ? `
          <div style="margin-bottom: 30px;">
            <p><strong>Period Start:</strong> ${new Date(
              invoice.periodStart
            ).toLocaleDateString()}</p>
            <p><strong>Period End:</strong> ${new Date(
              invoice.periodEnd
            ).toLocaleDateString()}</p>
          </div>
        `
            : ""
        }

        <div style="margin-bottom: 30px;">
          <h2>Order Summary</h2>
          ${invoice.orders
            .map(
              (order: any) => `
            <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
              <p style="font-family: monospace; margin-bottom: 10px;">
                #${order._id.slice(-12).toUpperCase()}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Items</th>
                    <th style="text-align: right;">Quantity</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.cartProducts
                    .map(
                      (item: any) => `
                    <tr>
                      <td>${item.product.name}</td>
                      <td style="text-align: right;">${item.quantity}</td>
                      <td style="text-align: right;">$${item.product.price.toFixed(
                        2
                      )}</td>
                      <td style="text-align: right;">$${(
                        item.quantity * item.product.price
                      ).toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
              <div style="text-align: right; margin-top: 10px;">
                <p style="font-weight: bold;">Total: $${order.total.toFixed(
                  2
                )}</p>
                ${
                  order.totalPremium
                    ? `
                  <p style="font-weight: bold;">Total Premium: $${order.totalPremium.toFixed(
                    2
                  )}</p>
                `
                    : ""
                }
              </div>
            </div>
          `
            )
            .join("")}

          <div style="text-align: right; margin-top: 30px; font-size: 1.2em; font-weight: bold;">
            <p>Total: $${invoice.orders
              .reduce((sum: number, order: any) => sum + order.total, 0)
              .toFixed(2)}</p>
            ${
              invoice.orders.some((order: any) => order.totalPremium)
                ? `
              <p>Total Premium: $${invoice.orders
                .reduce(
                  (sum: number, order: any) => sum + (order.totalPremium || 0),
                  0
                )
                .toFixed(2)}</p>
            `
                : ""
            }
          </div>
        </div>

        <div style="text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #ccc;">
          <p>Chinese Power Fresh Fruits Limited</p>
          <p>Fresh! Fresh! Fresh!</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
}
