import { BreadcrumbItemType } from "antd/es/breadcrumb/Breadcrumb";
import { atom } from "jotai";

export const breadcrumbAtom = atom<BreadcrumbItemType[]>([]);
