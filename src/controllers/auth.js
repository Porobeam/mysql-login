const controller = {};
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookie = require('cookie-parser');

controller.register = async (req, res) =>
{
    try
    {
        const { email, password, passwordConfirm, name } = req.body;
        req.getConnection(async (error, connection) => 
        {
            if (error)
            {
                console.log(error);
                return res.render('register', 
                {
                    message: 'Error connecting to the database'
                });
            }

            connection.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => 
            {
                if (error)
                {
                    console.log(error);
                    return res.render('register',
                    {
                        message: 'Error checking user email'
                    });
                }

                if (results.length > 0)
                {
                    return res.render('register',
                    {
                        message: 'Email is already in use'
                    });
                } 
                else if (password !== passwordConfirm)
                {
                    return res.render('register',
                    {
                        message: 'Passwords do not match'
                    });
                }

                let passwordHash = await bcrypt.hash(password, 8);
                console.log(passwordHash);

                connection.query('INSERT INTO users SET ?', {name: name, email: email, password_hash: passwordHash}, (error, results) =>
                {
                    if (error)
                    {
                        console.log(error);
                    }
                    else
                    {
                        console.log(results);
                        return res.render('register',
                        {
                            message: 'User created'
                        });
                    }
                })
            });
        });
    }
    catch(error)
    {
        console.log(error);
        return res.render('register',
        {
            message: 'Error during registration process'
        });
    }
};

controller.login = async (req, res) =>
{
    try
    {
        const { email, password } = req.body;

        req.getConnection(async (error, connection) =>
        {
            if (error) {
                console.log(error);
                return res.render('login', {
                    message: 'Error connecting to the database'
                });
            }

            connection.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
                if (error) {
                    console.log(error);
                    return res.render('login', {
                        message: 'Error fetching user data'
                    });
                }

                if (results.length === 0 || !(await bcrypt.compare(password, results[0].password_hash))) {
                    return res.render('login', {
                        message: 'Email or Password is incorrect'
                    });
                }

                const id = results[0].id;

                // Crear y firmar el token JWT (json web token)
                const token = jwt.sign({ id }, process.env.JWT_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log("The token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + Number(process.env.JWT_COOKIE_EXPIRES) * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                };                

                res.cookie('jwt', token, cookieOptions);

                req.session.isLogged = true; // Guardar el estado de la sesión
                req.session.save(err => { // Guardar la sesión explícitamente
                    if (err) {
                        console.error(err);
                    }
                    res.redirect('/'); // Redirigir solo después de guardar la sesión
                });
            });
        });
    } catch (error) {
        console.log(error);
        return res.render('login', {
            message: 'Error during the login process'
        });
    }
};


module.exports = controller;
