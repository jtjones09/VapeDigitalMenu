import flavorFruit from "@/assets/images/flavor-fruit.jpg";
import flavorMenthol from "@/assets/images/flavor-menthol.jpg";
import flavorDessert from "@/assets/images/flavor-dessert.jpg";
import flavorCandy from "@/assets/images/flavor-candy.jpg";
import flavorBeverage from "@/assets/images/flavor-beverage.jpg";
import flavorTobacco from "@/assets/images/flavor-tobacco.jpg";

const flavorImages: Record<string, string> = {
  fruit: flavorFruit,
  menthol: flavorMenthol,
  dessert: flavorDessert,
  candy: flavorCandy,
  beverage: flavorBeverage,
  tobacco: flavorTobacco,
};

export function getFlavorImage(flavorCategory: string | null | undefined): string {
  if (!flavorCategory) return flavorFruit;
  return flavorImages[flavorCategory.toLowerCase()] || flavorFruit;
}
