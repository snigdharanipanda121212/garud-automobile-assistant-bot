export interface Scene {
  id: number;
  title: string;
  duration: string;
  visuals: string;
  textOverlay: string;
  audioVO: string;
  audioMusic?: string;
  audioDialogue?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  model: 'L-3' | 'L-5';
  category: 'Passenger' | 'Cargo' | 'Tipper' | 'Loader';
  range: string;
  batteryWarranty: string;
  vehicleWarranty: string;
  price: string;
  imageUrl?: string;
}

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'Garud Passenger Special',
    model: 'L-5',
    category: 'Passenger',
    range: '200 KM',
    batteryWarranty: '3 Years',
    vehicleWarranty: '1 Year',
    price: '₹1,85,000',
    imageUrl: 'https://picsum.photos/seed/auto1/400/300'
  },
  {
    id: '2',
    name: 'Garud Cargo Pro',
    model: 'L-3',
    category: 'Cargo',
    range: '150 KM',
    batteryWarranty: '3 Years',
    vehicleWarranty: '1 Year',
    price: '₹1,65,000',
    imageUrl: 'https://picsum.photos/seed/auto2/400/300'
  }
];

export const COMMERCIAL_SCRIPT: Scene[] = [
  {
    id: 1,
    title: "Garud Automobiles Berhampur: Delivering Premium Whistle Evico Vehicles with Unmatched Quality & Reliability.",
    duration: "0:00 - 0:05",
    visuals: "",
    textOverlay: "\"THE WAIT IS OVER\" -> \"GARUD AUTOMOBILES ARRIVES\" (Odiya)",
    audioVO: "Suno, Suno, Suno! Berhampuriya mana payeen bada khushi khabara!",
    audioDialogue: "Electricity byabahara karantu, petrol banchantu!"
  },
  {
    id: 2,
    title: "The Vehicles in Action",
    duration: "0:05 - 0:15",
    visuals: "Dynamic shots of L-5 & L-3 lineup. Driving down Berhampur street, past Santoshi Maa Temple. Wide shot with electric blue and lemon yellow light trails.",
    textOverlay: "\"L-5 & L-3 Models Available\"",
    audioVO: "The all-new range of L-5 and L-3 EVCO e-vehicles has arrived! Travel Smart, Live Powerful!",
    audioMusic: "Upbeat, local Ganjam electronic-infused folk music.",
    audioDialogue: "Garud gadi chalaantu, paribesh banchantu!"
  },
  {
    id: 3,
    title: "Community Conversation",
    duration: "0:15 - 0:30",
    visuals: "Split-screen. Left: Two local auto drivers at a tea shop talking excitedly. Right: Stylized cutaway of motor and battery with electric blue current effects.",
    textOverlay: "\"RANGE 200 KM PER CHARGE\", \"3 YEARS WARRANTY on LITHIUM ION BATTERY\", \"1 YEAR WARRANTY on VEHICLE\"",
    audioDialogue: "Driver 1: \"Are brother, sunichha? Nua e-vehicle asichi...\" Driver 2: \"Hahn re, dekhili. 200 km range...\"",
    audioVO: "200 km range per charge... and 3 years battery warranty! They say the speed is also very good."
  },
  {
    id: 4,
    title: "Services, Exchange & Finance",
    duration: "0:30 - 0:40",
    visuals: "Clean graphic interface. Old auto-rickshaw transitioning to modern e-vehicle with green arrow. Icons for repair and finance.",
    textOverlay: "\"QUICK REPAIR & SERVICE\", \"EXCHANGE OLD EV VEHICLES\", \"FINANCE AVAILABLE\"",
    audioVO: "But that's not all! At Garud Automobiles, we don't just sell, we care! We provide quick, professional repair and service. And yes, bring in your old EV vehicle with 60 to 70% functional capacity, and we'll offer a fair exchange towards your new model! Financing options are also available."
  },
  {
    id: 5,
    title: "Booking & Call to Action",
    duration: "0:40 - 0:45",
    visuals: "Garud Automobiles storefront. Friendly person by the new auto-rickshaw. Business board visible with address.",
    textOverlay: "\"BOOKINGS OPEN\", \"SECURE AT ₹50,000 ONLY + ADVANCE\", \"GARUD AUTOMOBILES, Near Santoshi Maa Temple...\"",
    audioVO: "The revolution in green transport has started! Bookings are open now! Secure your vehicle with just ₹50,000 and the advance amount. Visit us or call today!"
  },
  {
    id: 6,
    title: "Test Drive Invitation",
    duration: "0:45 - 0:50",
    visuals: "A customer happily driving a Garud L-5 vehicle. The owner waving and smiling. Large text overlay: 'BOOK YOUR TEST DRIVE NOW'.",
    textOverlay: "\"FREE TEST DRIVE AVAILABLE\"",
    audioVO: "Don't just take our word for it! Come and experience the power and comfort of Garud vehicles yourself. Book your free test drive at our Berhampur showroom today!"
  },
  {
    id: 7,
    title: "Contact & Information",
    duration: "0:50 - 0:55",
    visuals: "Full screen graphic with Garud Automobiles logo and contact details. Animated phone icon.",
    textOverlay: "\"FOR MORE INFORMATION CALL: 8221822926\"",
    audioVO: "For more information, call us at 8221822926. Garud Automobiles, Berhampur - Your partner in green mobility!"
  }
];

export const OWNER_MESSAGE = "Welcome to Garud Automobiles! We are committed to providing the best electric vehicle solutions in Berhampur. Visit us for a test drive today!";

export interface Review {
  id: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleType?: string;
  createdAt: any;
}

export interface QuotationRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  financeNeeded: boolean;
  vehicleId: string;
  vehicleName: string;
  vehicleModel: string;
  vehiclePrice: string;
  status: 'pending' | 'contacted' | 'closed';
  createdAt: any;
}

export interface TestDriveBooking {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  vehicleId: string;
  vehicleName: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: any;
}
