import { readDataSafe, updateData } from "./data";
import { generateId, now } from "./utils";
import type { Template, TemplatesData } from "@/types/template";
import type { Carousel } from "@/types/carousel";

const FILE = "templates.json";
const EMPTY: TemplatesData = { templates: [] };

async function load(): Promise<TemplatesData> {
  return readDataSafe<TemplatesData>(FILE, EMPTY);
}

export async function listTemplates(): Promise<Template[]> {
  const data = await load();
  return data.templates;
}

export async function getTemplate(id: string): Promise<Template | null> {
  const data = await load();
  return data.templates.find((t) => t.id === id) ?? null;
}

export async function saveAsTemplate(
  carousel: Carousel,
  name?: string,
  description?: string
): Promise<Template> {
  let template!: Template;
  await updateData<TemplatesData>(FILE, EMPTY, (data) => {
    template = {
      id: generateId(),
      name: name || carousel.name,
      description: description || `Template from ${carousel.name}`,
      aspectRatio: carousel.aspectRatio,
      slides: carousel.slides.map(({ id, html, order, notes }) => ({
        id,
        html,
        order,
        notes,
      })),
      tags: carousel.tags,
      createdAt: now(),
    };
    data.templates.push(template);
  });
  return template;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  let deleted = false;
  await updateData<TemplatesData>(FILE, EMPTY, (data) => {
    const idx = data.templates.findIndex((t) => t.id === id);
    if (idx === -1) return;
    data.templates.splice(idx, 1);
    deleted = true;
  });
  return deleted;
}
