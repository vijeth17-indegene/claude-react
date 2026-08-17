import { useState, useEffect } from 'react';

export default function LsWithoutHook() {
    
    const [name, setName] = useState<string>(() => {
        const storedValue = localStorage.getItem("username");
        if (storedValue === null) return "";
        try {
            return JSON.parse(storedValue);
        }
        catch {
            return "";
        }
    });

    useEffect(() => {
        localStorage.setItem("username", JSON.stringify(name));
    }, [name])

    

    return(
        <>
            <label>Username: {name}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <button onClick={() => setName("")}>Clear</button>
        </>
    );
}


//useState is a hook that allows you to add state to a functional component. It returns an array with two elements: the current state value and a function to update that value. In this case, useState is used to manage the "name" state, which holds the username.
//useEffect is a hook that allows you to perform side effects in a functional component. It takes a function as an argument and runs it after the component renders. In this case, useEffect is used to update the localStorage whenever the "name" state changes. This ensures that the username is saved in localStorage whenever it is updated.

//setItem is a method of the localStorage object that allows you to store data in the browser's local storage. It takes two arguments: a key (in this case, "username") and a value (in this case, the stringified version of the "name" state). This method is used to save the username in localStorage whenever it changes.
// why do we need to use JSON.stringify here?
//JSON.stringify is used to convert a JavaScript value (in this case, the "name" state) into a JSON string. This is necessary because localStorage can only store strings, so we need to convert the value to a string before saving it. When we retrieve the value from localStorage, we can use JSON.parse to convert it back to its original form.

//getItem is a method of the localStorage object that allows you to retrieve data from the browser's local storage. It takes one argument: a key (in this case, "username"). This method is used to get the username from localStorage when the component first renders. If there is no value stored for that key, it returns null.
//why do we need to use JSON.parse here?
//JSON.parse is used to convert a JSON string back into a JavaScript value. When we retrieve the value from localStorage, it is stored as a string, so we need to use JSON.parse to convert it back to its original form (in this case, a string representing the username). If the value is not a valid JSON string, it will throw an error, which is why we have a try-catch block to handle that case.

//why getItem is used in useState and setItem is used in useEffect?
//getItem is used in useState to initialize the "name" state with the value stored in localStorage when the component first renders. This ensures that the component starts with the correct value from localStorage. If there is no value stored for that key, it initializes the state with an empty string.
//setItem is used in useEffect to update the value in localStorage whenever the "name" state changes. This ensures that the localStorage always has the latest value of the "name" state.