import type { AspectRatio } from "./carousel";
import type { LayoutId } from "./layout";

export interface BrandLayout {
  id: string;
  name: string;
  description: string;
  layout: LayoutId;
  aspectRatio: AspectRatio;
  html: string;
  tags: string[];
  brand: string;
  createdAt: string;
}

export interface LayoutLibraryData {
  layouts: BrandLayout[];
}
