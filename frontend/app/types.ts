export type Flight = {
  flight_id: string;
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time_local: string;
  duration_hours: number;
  stops: number;
  cabin_class: string;
  total_price_usd: number;
  image_url?: string;
};

export type Hotel = {
  hotel_id: string;
  name: string;
  city: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  rooms: number;
  nightly_rate_usd: number;
  star_rating: number;
  walkability_score: number;
  amenities: string[];
  image_url?: string;
};

export type ItineraryDay = {
  date: string;
  pace: string;
  activities: string[];
  image_url?: string;
};

export type CostBreakdown = {
  flight: number;
  hotel: number;
  food_and_local_transport: number;
  total_estimate: number;
};
