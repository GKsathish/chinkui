export interface Table {
    tableId: string,
    tableName: string,
    phase?: string,
    gameName?: string; // Add this if your data includes gameName
    category: string,
    slug: string,
    iframe: string,
    orientation: 'landscape-primary' | 'portrait-primary'
}