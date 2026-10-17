import { redirect } from "next/navigation";

/**
 * La gestione delle tappe mappa (map_spots) è stata spostata nella pagina Luoghi.
 * Reindirizza automaticamente.
 */
export default function MapSpotsRedirect() {
  redirect("/admin/places");
}
