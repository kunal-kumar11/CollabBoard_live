export type Tool =
  | "pen"
  | "line"
  | "rectangle"
  | "circle";

export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface CanvasUpdate {
  roomId: string | null;
  json: unknown;
}