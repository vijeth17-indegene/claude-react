type ListProps<T> = {
    items: T[];
    getKey: (item: T) => string;
    renderItem: (item: T) => React.ReactNode;
};

export default function List<T>({
    items,
    getKey,
    renderItem,
}: ListProps<T>) {
    return(
        <ul>
            {items.map((item) => (
                <li key={getKey(item)}>{renderItem(item)}</li>
            ))}
        </ul>
    );
}


//Generic components are a way to create reusable components that can work with different types of data. 
// In this example, the List component is defined as a generic component that takes a type parameter T. 
// The ListProps interface defines the props that the List component expects, including an array of items of type T, a function to get a unique key for each item, and a function to render each item.