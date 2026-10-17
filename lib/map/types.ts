export type MapTourType = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  color: string;
  icon: string | null;
  is_custom_tour: boolean;
};

export type MapReview = {
  id: string;
  author_name: string;
  author_location_it: string | null;
  author_location_en: string | null;
  review_text: string;
  rating: number;
  submitted_at: string;
  place_id: string | null;
  map_spot_id: string | null;
};

export type MapPlaceMarker = {
  kind: "place";
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  short_description_it: string;
  short_description_en: string;
  lat: number;
  lng: number;
  cover_image_url: string | null;
  duration_hours: number | null;
  difficulty: string | null;
  tour_type_id: string | null;
  tour_color: string;
};

export type MapSpotMarker = {
  kind: "spot";
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  short_description_it: string | null;
  short_description_en: string | null;
  lat: number;
  lng: number;
  cover_image_url: string | null;
  tour_type_id: string | null;
  tour_color: string;
  place_id: string | null;
};

export type MapMarker = MapPlaceMarker | MapSpotMarker;

export type PublicMapData = {
  tourTypes: MapTourType[];
  places: MapPlaceMarker[];
  spots: MapSpotMarker[];
  reviews: MapReview[];
};

export type MapSelection =
  | { type: "marker"; marker: MapMarker }
  | { type: "free"; lat: number; lng: number }
  | { type: "out"; lat: number; lng: number }
  | null;
