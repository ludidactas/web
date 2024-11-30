declare module "*.mdx" {
  import type { ComponentType } from "react";
  
  export const meta: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
  
  const Component: ComponentType;
  export default Component;
}