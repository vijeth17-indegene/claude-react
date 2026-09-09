const obj = {
    name: 'obj',
    regular() {
        return this.name;
    },
    arrow: () => this?.name,
    nested() {
        const inner = function() {
            return this?.name;
        }
        return inner();
    },
    nestedArrow() {
        const inner = () => this.name;
        return inner();
    }
}

console.log(obj.regular()); // "obj" because regular function's this refers to the object itself
console.log(obj.arrow()); // undefined because arrow function's this is lexically scoped (here it's the global scope)
console.log(obj.nested()); // undefined because inner function's this refers to the global scope
console.log(obj.nestedArrow()); // "obj" because arrow function inherits this from the enclosing context (nestedArrow method)

const detached = obj.regular;
console.log(detached()); // undefined because detached function's this refers to the global scope

//Then write a bind polyfill — Function.prototype.myBind — handling partial application (fn.myBind(ctx, 1, 2) then called with (3) gives all three args).
Function.prototype.myBind = function(context, ...args) {
    const fn = this;
    return function(...innerArgs) {
        return fn.apply(context, [...args, ...innerArgs]);
    };
};

// Example usage of myBind
const bound = detached.myBind(obj);
console.log(bound()); // "obj" because myBind sets the this context to obj


// Example usage of myBind with partial application
function add(a, b, c) {
    return a + b + c;
}
const addPartial = add.myBind(null, 1, 2);
console.log(addPartial(3)); // 6 because myBind handles partial application


