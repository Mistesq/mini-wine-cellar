export type DemoBottle = {
  id: string;
  name: string;
  producer: string;
  region: string;
  vintage: number;
  photoUrl: string | null;
  likesCount: number;
  createdAt: Date;
};

// Fictional wines and producers from real regions. Photos are hotlinked from
// Wikimedia Commons under free licenses; source and attribution sit next to each.
// createdAt is fixed in the past, so the order is stable and bottles added
// through the UI land above these.
export const DEMO_BOTTLES: DemoBottle[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "Grand Vin",
    producer: "Château Belcroix",
    region: "Pauillac, France",
    vintage: 1998,
    // https://commons.wikimedia.org/wiki/File:Red_wine_bottle_and_glass_on_a_gray_surface_during_an_evening_gathering.jpg
    // Shixart1985, CC BY 2.0 (https://creativecommons.org/licenses/by/2.0)
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Red_wine_bottle_and_glass_on_a_gray_surface_during_an_evening_gathering.jpg/960px-Red_wine_bottle_and_glass_on_a_gray_surface_during_an_evening_gathering.jpg",
    likesCount: 5,
    createdAt: new Date("2026-01-01T10:00:00Z"),
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    name: "Reserva Tinto",
    producer: "Bodegas Monteluz",
    region: "Rioja, Spain",
    vintage: 2012,
    // https://commons.wikimedia.org/wiki/File:Bottle_and_glass_of_red_wine.jpg
    // congerdesign, CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bottle_and_glass_of_red_wine.jpg/960px-Bottle_and_glass_of_red_wine.jpg",
    likesCount: 2,
    createdAt: new Date("2026-01-02T10:00:00Z"),
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    name: "Sangiovese Riserva",
    producer: "Tenuta Valfiora",
    region: "Chianti Classico, Italy",
    vintage: 2016,
    // https://commons.wikimedia.org/wiki/File:Sangiovese_bottles_aging_in_cellar.jpg
    // bradleypjohnson, CC BY 2.0 (https://creativecommons.org/licenses/by/2.0)
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sangiovese_bottles_aging_in_cellar.jpg/960px-Sangiovese_bottles_aging_in_cellar.jpg",
    likesCount: 3,
    createdAt: new Date("2026-01-03T10:00:00Z"),
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    name: "Sauvignon Blanc",
    producer: "Kahu Ridge Wines",
    region: "Marlborough, New Zealand",
    vintage: 2023,
    // No photo on purpose: the card shows the placeholder.
    photoUrl: null,
    likesCount: 0,
    createdAt: new Date("2026-01-04T10:00:00Z"),
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    name: "Riesling Kabinett",
    producer: "Weingut Steinhalde",
    region: "Mosel, Germany",
    vintage: 2021,
    // https://commons.wikimedia.org/wiki/File:Glass_of_White_Wine_shot_with_a_bottle_of_white_wine_-_Evan_Swigart.jpg
    // Evan Swigart, CC BY 2.0 (https://creativecommons.org/licenses/by/2.0)
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/8d/Glass_of_White_Wine_shot_with_a_bottle_of_white_wine_-_Evan_Swigart.jpg",
    likesCount: 1,
    createdAt: new Date("2026-01-05T10:00:00Z"),
  },
  {
    id: "00000000-0000-4000-8000-000000000106",
    name: "Old Vine Shiraz",
    producer: "Redgum Hill Estate",
    region: "Barossa Valley, Australia",
    vintage: 2018,
    // https://commons.wikimedia.org/wiki/File:Glass_of_Red_Wine_with_a_bottle_of_Red_Wine_-_Evan_Swigart.jpg
    // Evan Swigart, CC BY 2.0 (https://creativecommons.org/licenses/by/2.0)
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/88/Glass_of_Red_Wine_with_a_bottle_of_Red_Wine_-_Evan_Swigart.jpg",
    likesCount: 4,
    createdAt: new Date("2026-01-06T10:00:00Z"),
  },
];
