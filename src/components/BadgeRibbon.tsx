'use client';

import { Badge } from "antd";
import { RibbonProps } from "antd/es/badge";
import React from "react";

export default function BadgeRibbon({ children, ...rest }: RibbonProps & { children: React.ReactNode }) {
    return (
        <Badge.Ribbon {...rest}>
            {children}
        </Badge.Ribbon>
    );
}
