export interface Game {
  id: string;
  slug: string;
  [key: string]: any;
}

export const games: Game[] = [];
