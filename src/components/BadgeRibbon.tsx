'use client';

import { Badge } from "antd";
import React from "react";

export default function BadgeRibbon({ children, ...rest }: any & { children: React.ReactNode }) {
    return (
        <Badge.Ribbon {...rest}>
            {children}
        </Badge.Ribbon>
    );
}
