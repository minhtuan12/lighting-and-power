import PayOS from "@payos/node";

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID || "PAYOS_CLIENT_ID",
    process.env.PAYOS_API_KEY || "PAYOS_API_KEY",
    process.env.PAYOS_CHECKSUM_KEY || "PAYOS_CHECKSUM_KEY"
);

export default payos;
