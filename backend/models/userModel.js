class UserModel{
    constructor(id, username, email, password){
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.age = this.age;
    }

    getId(){
        return this.id;
    }

    getUsername(){
        return this.username;
    }

    getEmail(){
        return this.email;
    }

    getPassword(){
        return this.password;
    }

    getAge(){
        return this.age;
    }

    setId(id){
        this.id = id;
    }

    setUsername(username){
        this.username = username;
    }

    setEmail(email){
        this.email = email;
    }

    setPassword(password){
        this.password = password;
    }

    setAge(age){
        this.age = age;
    }
}

module.exports = UserModel;
