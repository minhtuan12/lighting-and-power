import { Model } from 'mongoose';

export class SlugGenerator {
    /**
     * Generate slug from text (Vietnamese support)
     */
    static generateSlug(text: string): string {
        // Convert to lowercase
        let slug = text.toLowerCase();

        // Replace Vietnamese characters
        slug = slug.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
        slug = slug.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
        slug = slug.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
        slug = slug.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
        slug = slug.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
        slug = slug.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
        slug = slug.replace(/đ/g, 'd');

        // Remove special characters
        slug = slug.replace(/[^a-z0-9\s-]/g, '');

        // Replace spaces and multiple dashes with single dash
        slug = slug.replace(/\s+/g, '-');
        slug = slug.replace(/-+/g, '-');

        // Remove leading and trailing dashes
        slug = slug.replace(/^-+|-+$/g, '');

        return slug;
    }

    /**
     * Generate unique slug by checking database
     */
    static async generateUniqueSlug(
        text: string,
        model: Model<any>,
        options: {
            field?: string;        // Field name to check (default: 'slug')
            excludeId?: string;    // Exclude this ID when checking (for updates)
        } = {}
    ): Promise<string> {
        const { field = 'slug', excludeId } = options;

        const baseSlug = this.generateSlug(text);
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            // Build query
            const query: any = { [field]: slug };

            // Exclude current document ID (for updates)
            if (excludeId) {
                query._id = { $ne: excludeId };
            }

            // Check if slug exists
            const existing = await model.findOne(query);

            if (!existing) {
                return slug; // Slug is unique
            }

            // Slug exists, try with counter
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    /**
     * Generate slug with custom separator
     */
    static generateSlugWithSeparator(text: string, separator: string = '-'): string {
        const slug = this.generateSlug(text);
        if (separator !== '-') {
            return slug.replace(/-/g, separator);
        }
        return slug;
    }

    /**
     * Generate slug with max length
     */
    static generateSlugWithMaxLength(text: string, maxLength: number = 100): string {
        let slug = this.generateSlug(text);

        if (slug.length > maxLength) {
            slug = slug.substring(0, maxLength);
            // Remove trailing dash if any
            slug = slug.replace(/-+$/, '');
        }

        return slug;
    }
}
