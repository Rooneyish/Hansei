class UserModel{
    constructor(id, username, email, password){
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
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
}

module.exports = UserModel;
