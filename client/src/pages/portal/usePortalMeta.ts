import { useEffect } from "react";

interface PortalMetaOptions {
  title: string;
  description?: string;
}

export function usePortalMeta({ title, description }: PortalMetaOptions) {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDesc && description) metaDesc.content = description;

    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;

    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc && description) ogDesc.content = description;

    return () => {
      document.title = "Dr. Alejandro Viveros Dominguez - Otorrinolaringología";
    };
  }, [title, description]);
}
