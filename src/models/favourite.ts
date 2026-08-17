import { IFavourite } from "@/types/favourite"
import mongoose, { Schema } from "mongoose"

const FavouriteSchema = new Schema(
    { userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, productId: { type: Schema.Types.ObjectId, ref: "Product", required: true } },
    { timestamps: true },
)
FavouriteSchema.index({ userId: 1, productId: 1 }, { unique: true })
const Favourite = mongoose.models.Favourite || mongoose.model<IFavourite>("Favourite", FavouriteSchema)
export default Favourite
