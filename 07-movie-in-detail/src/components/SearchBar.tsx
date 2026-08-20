type SearchBarProps = {
    value: string;
    onChange: (value: string) => void;
}

export default function SearchBar({value, onChange}: SearchBarProps) {
    const handleSearchChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    }

    return(
        <>
            
            <input type="text" value={value} onChange={handleSearchChange} />

        </>
    );
}