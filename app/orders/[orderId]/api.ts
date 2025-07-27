import axios from "axios";

interface OrderItem {
  id: {
    _id: string;
    name: string;
    displayNames: {
      en: string;
      "zh-TW": string;
    };
    images: string[];
    price: number;
  };
  quantity: number;
}

interface Order {
  _id: string;
  user: string;
  name: string;
  email: string;
  phone: number; // Change to number type
  shippingAddress: {
    en: string;
    "zh-TW": string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  items: OrderItem[];
  deliveryMethod: number;
  paymentMethod: "online" | "offline" | "periodInvoice";
  orderType: "onetime-order" | "period-order";
  periodInvoiceNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  orderReference: string;
  status:
    | "pending"
    | "pending_payment_verification"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentProof?: string;
  paymentReference?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
}

export const fetchOrder = async (orderId: string): Promise<Order> => {
  try {
    const response = await axios.get(`/api/orders/${orderId}`);
    if (response.status === 200) {
      console.log("Order API response:", {
        orderType: response.data.orderType,
        paymentMethod: response.data.paymentMethod,
        periodInvoiceNumber: response.data.periodInvoiceNumber,
        orderReference: response.data.orderReference,
        fullData: response.data,
      });
      return response.data;
    }
    throw new Error("Failed to fetch order");
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};
