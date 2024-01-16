const express = require('express');
const encode = require('html-entities').encode;

const jwt = require('jsonwebtoken');

const fs = require('fs');
const path = require("path");

const uuid4 = require("uuid4");
const mathjs = require('mathjs')

const user = require("../models/users");
const forum = require("../models/forum");


const router = express.Router();

function middleware_session_verify(req, res, next) {
    let sess = req.session;

    if (!sess.username){
        return res.json({ success: false ,msg: "you have to login first."});
    }

    next();
}

function middleware_nosqli_fix(req, res, next) {
    const body = req.body;
    // const query = req.query;
    // let params_query = ["email", "username"];

    let params_body = ["email", "username", "password"];

    for (param of params_body){
        if ( body[param] && typeof body[param] !== 'string'){
            res.json({ success: false, data: "parameters must be string" });
            return;
        }
    }

    next();
}


// A10-9 - USING COMPONENTS WITH KNOWN VULN
router.post('/api/read_log', function(req, res, next) {
    // const lookFor = path.join(__dirname, req.body.calc);
    const lookFor = req.body.file;
    let retData;

    try {
        retData = fs.readFileSync(`./public/storage/data/private/${lookFor}`).toString('utf8');
    } catch (err) {
        if (err.code === "EISDIR"){
            retData = fs.readdirSync(`./public/storage/data/private/${lookFor}`).toString('utf8');
        }else{
            retData = err;
        }
    }

    res.status(200).json({
        msg:retData
    });

});
router.post('/api/safe_calc', function(req, res, next) {

    // solution: https://jwlss.pw/mathjs/
    // https://onlinestringtools.com/convert-decimal-to-string

    res.status(200).json({
        msg: mathjs.eval(req.body.calc)
    });

});
router.post('/api/calc', function(req, res, next) {

    // process.cwd()
    // var fs=require("fs");fs.readdirSync("/app.js").toString('utf8')
    // require('child_process').exec('whoami')

    res.status(200).json({
        msg: eval(req.body.calc)
    });

});

//A7
/**
 * @swagger
 * /api/xss/stage/{id}:
 *   get:
 *     summary: Returns data based on the XSS stage ID
 *     description: Retrieves data or message depending on the XSS stage ID provided
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The XSS stage ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query parameter
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country query parameter
 *     responses:
 *       200:
 *         description: Success response with data or message
 *       default:
 *         description: Unexpected error
 */
router.get('/api/xss/stage/:id', function(req, res, next) {
    switch (req.params.id){
        case "1":
        case "5":
        case "6":
            return res.status(200).send(
                req.query.search
            );

        case "3":
            // add Json content-type to fix the XSS .json instead of .send
            // res.setHeader('content-type', 'application/json');

            res.setHeader('content-type', 'text/html');
            return res.status(200).send({
                msg: encode(req.query.search),
                country: req.query.country
            });

        case "4":
            return res.status(200).json({
            msg: encode(req.query.search)
        });

        default:
            return res.status(200).json({
            msg: "not found!",
        });
    }
});

// report referer url
router.get('/report', function(req, res, next) {
    fs.writeFileSync(`csp.log`, req.headers.referer, 'utf8');
    res.status(200).send("ok");
});

// upload file
router.post('/upload', function(req, res, next) {
    let uploadedFile = req.files.file;

    // Use the mv() method to place the file somewhere on your server
    uploadedFile.mv(`public/uploads/${uploadedFile.name}`, function (err) {
        if (err) return res.status(500).send(err);
        else return res.redirect(`/a7/stage/8?image=${uploadedFile.name}`);
    });

});

// redirect to url
router.get('/redirect', function(req, res, next) {
    return res.redirect(req.query.url);
});

// print user agent
router.get('/api/user', function(req, res, next) {
    res.status(200).send(req.headers["user-agent"]);
});

// A6 - CORS | CSRF
router.get('/api/whoami', function(req, res, next) {
    let sess = req.session;
    let origin = req.get('origin');

    // Allow CORS
    if (origin) {
        // res.setHeader("Access-Control-Allow-Origin", origin);
        // res.setHeader("Access-Control-Allow-Credentials", "true");

        // res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS"); //Not Mandatory
    }

    return res.json(
        {
            username: sess.username,
            email: sess.email,
            role: sess.role
        });
});

router.post('/api/message', middleware_session_verify, function(req, res, next) {
    let sess = req.session;
    let cont_type = req.headers['content-type'];

    // add support for text/plain
    if (cont_type && cont_type.indexOf('text/plain') == 0){
        req.body = JSON.parse(req.body);
    }

    new forum({
        username: sess.username,
        msg: req.body.msg

    }).save(function (err, saved_object) {

        forum.find({}, (err, docs) => {
            if (err) console.log(err);

            return res.json({ success: true ,msg: docs});
        });

    });

});

router.post('/api/message_cookie', middleware_session_verify, function(req, res, next) {
    let sess = req.session;
    let cont_type = req.headers['content-type'];

    if (req.cookies.csrf != sess.csrf){
        return res.json({ success: false ,msg: "Wrong CSRF token"});
    }

    // add support for text/plain
    if (cont_type && cont_type.indexOf('text/plain') == 0){
        req.body = JSON.parse(req.body);
    }

    new forum({
        username: sess.username,
        msg: req.body.msg

    }).save(function (err, saved_object) {

        forum.find({}, (err, docs) => {
            if (err) console.log(err);

            return res.json({ success: true ,msg: docs});
        });

    });

});

router.post('/api/message_token', middleware_session_verify, function(req, res, next) {
    let sess = req.session;
    let cont_type = req.headers['content-type'];

    // It is possible to bypass this verification by removing the csrf parameter from the request!
    if (req.body.csrf && req.body.csrf != sess.csrf){
        return res.json({ success: false, msg: "Wrong CSRF token"});
    }

    // add support for text/plain
    if (cont_type && cont_type.indexOf('text/plain') == 0){
        req.body = JSON.parse(req.body);
    }

    new forum({
        username: sess.username,
        msg: req.body.msg

    }).save(function (err, saved_object) {

        forum.find({}, (err, docs) => {
            if (err) console.log(err);

            return res.json({ success: true ,msg: docs});
        });

    });

});

router.get('/api/message', function(req, res, next) {

    forum.find({}, (err, docs) => {
        if (err) console.log(err);

        return res.json({ success: true ,msg: docs});
    });

});

router.get('/api/clickjacking/stage/:id', function(req, res, next) {
    let sess = req.session;

    let likes = (sess["likes"] ? sess["likes"]++ : sess["likes"]=1);

    return res.status(200).json({
        msg: likes
    });

});

// A5 - SSRF
router.get('/api/secret', function(req, res, next) {
    if (req.headers.host.includes("127.0.0.1")){
        res.status(200).send("The password is 'SSRF_Master'");
    }else{
        res.status(200).send("Nothing here");
    }
});

router.post('/api/get_score/:username', function(req, res, next) {
    let sess = req.session;

    user.findOne({
        $or: [{
            "username": req.params.username.toLowerCase()
        }, {
            "email": req.params.username.toLowerCase()
        }],

    }, (err, docs) => {
        if (err) console.log(err);

        if (docs == null || docs.length == 0) {
            return res.json({ success: false, msg: "username not found"});
        }

        return res.json({ score: docs.score, username: docs.username });
    });

});

router.post('/api/add_score/:username', function(req, res, next) {
    let sess = req.session;

    if (sess.username != req.params.username){
        return res.json({ success: false, msg: `You are not ${req.params.username}`});
    }

    if (req.body.score != (req.body.hash ^ 0x07)){
        return res.json({ success: false, msg: "wrong hash"});
    }

    user.updateOne({
        $or: [{
            "username": req.params.username.toLowerCase()
        }, {
            "email": req.params.username.toLowerCase()
        }]},{
        $set: {
           "score" : req.body.score
        }

    }, (err, docs) => {
        if (err) console.log(err);

        if (docs == null || docs.length == 0) {
            return res.json({ success: false, msg: "username not found"});
        }

        return res.json({ success: true });
    });

});

// version 1
router.post('/api/transfer_score/:username', function(req, res, next) {
    let sess = req.session;

    if (sess.username != req.params.username){
        return res.json({ success: false, msg: `You are not ${req.params.username}`});
    }

    // from user
    user.updateOne({ "_id": req.body.hash},{ $inc: { "score" : -req.body.score } }, (err, docs) => {
        if (err) console.log(err);

        if (docs == null || docs.length == 0) {
            return res.json({ success: false, msg: "from username not found"});
        }
    });

    // to user
    user.updateOne({ "_id": req.body.to_user},{ $inc: { "score" : +req.body.score } },(err, docs) => {
        if (err) console.log(err);

        if (docs == null || docs.length == 0) {
            return res.json({ success: false, msg: "to username not found"});
        }
        return res.json({ success: true });
    });

});

router.get('/api/all_users', function(req, res, next) {
    let sess = req.session;

        user.find({},{"username":1}, (err, docs) => {
            if (err) console.log(err);

            if (docs == null || docs.length == 0) {
                return res.json({ success: false, msg: "username not found"});
            }

            return res.json({ success: true, users: docs });
        });

});

// A2 - Broken Authentication
router.post('/api/login_uuid', function(req, res, next) {

    user.findOne({
        $or: [{
            "username": req.body.creds.toLowerCase()
        }, {
            "email": req.body.creds.toLowerCase()
        }],
        "password": req.body.password

    }, (err, docs) => {
        if (err) console.log(err);

        if (docs == null || docs.length == 0) {
            return res.json({ success: false, msg: "username not found or wrong password"});
        }

        return res.json({ token: docs.uuid });
    });

});
router.post('/api/login_uuid_verify', function(req, res, next) {

    user.findOne({uuid: req.body.uuid}, (err, docs) => {
        if (err) console.log(err);

        if (docs == null || docs.length == 0) {
            return res.json({ success: false, msg: "username not found"});
        }

        user.findOne({
            $or: [{
                "username": req.body.creds.toLowerCase()
            }, {
                "email": req.body.creds.toLowerCase()
            }]
        }, (err, docs) => {
            if (err) console.log(err);

            if (docs == null || docs.length == 0) {
                return res.json({ success: false, msg: "username not found or wrong password"});
            }

            return res.json({ msg: `welcome ${docs.username}, role: ${docs.role}` });
        });
    });

});

// A2 - insufficient Anti Automation
router.post('/api/login_anti_automation/:id', function(req, res, next) {

    let sess = req.session;

    if (req.params.id == 1){
        return res.json({ msg: sess.anti_automation_password });

    } else {
        if (req.body.password == sess.anti_automation_password){
            return res.json({ msg: `welcome roman, role: admin` });

        } else {
            return res.json({ msg: `wrong password` });

        }
    }


});

// A2 - JWT
router.post('/api/login_jwt/:type?', function(req, res, next) {
    let sess = req.session;
    let jwt_hash = "";

    if (req.params.type == 'hs256'){
        jwt_hash = jwt.sign(
            { username: sess.username , role: sess.role},
            "secret",
            {
                algorithm: "HS256",
                expiresIn: "2h",
            });
    }else if (!req.params.type){
        jwt_hash = jwt.sign(
            { username: sess.username , role: sess.role},
            "secret",
            {
                algorithm: "HS256",
                expiresIn: "2h",
            });
    }else if (req.params.type == 'rs256'){
        const privateKey = fs.readFileSync('./public/keys/jwtRS256.key');
        jwt_hash = jwt.sign(
            { username: sess.username , role: sess.role},
            privateKey,
            {
                algorithm: "RS256",
                expiresIn: "2h",
            });
    }

    return res.json({ success: true, token: jwt_hash});
});
router.post('/api/login_jwt_relogin/:type?', function(req, res, next) {
    let sess = req.session;
    let jwt_hash = ""

    try {
        if (req.params.type == 'hs256') {
            jwt_hash = jwt.verify(req.body.jwt, "secret",{algorithms: ['HS256']})

        }else if (!req.params.type){
            try {
                jwt_hash = jwt.verify(req.body.jwt)

            } catch (e) {
                jwt_hash = jwt.verify(req.body.jwt, "secret",{algorithms: ['HS256']})

            }

        } else if (req.params.type == 'rs256'){

            const publicKey = fs.readFileSync('./public/keys/jwtRS256.key.pub');
            jwt_hash = jwt.verify(req.body.jwt, publicKey, {algorithms: ['RS256']})
        }

        // change include to == otherwise we will have a logical bug
        return res.json({ success: true, username: jwt_hash.username, role: (jwt_hash.username.includes("roman") ? "admin":"user") });

    } catch (err) {
        console.log(err);
        return res.status(401).json({success: false, msg: "Invalid JWT"});
    }

});

/**
 * @swagger
 * /api/generate_jwt/{type}:
 *   post:
 *     summary: Generates a JWT token
 *     description: Generates a JWT token based on the specified type (HS256 or RS256) and user credentials
 *     parameters:
 *       - in: path
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *         description: The type of JWT algorithm to use (HS256 or RS256)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for the JWT token
 *               role:
 *                 type: string
 *                 description: Role for the JWT token
 *     responses:
 *       200:
 *         description: Successfully generated JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       default:
 *         description: Unexpected error
 */
router.post('/api/generate_jwt/:type?', function(req, res, next) {
    let jwt_hash = "";

    if (req.params.type == 'HS256'){
        jwt_hash = jwt.sign(
            { username: req.body.username , role: req.body.role},
            "secret",
            {
                algorithm: "HS256",
                expiresIn: "2h",
            });
        console.log(jwt_hash);
    } else if (req.params.type  == 'RS256'){
        const privateKey = fs.readFileSync('./public/keys/jwtRS256.key');
        jwt_hash = jwt.sign(
            { username: req.body.username , role: req.body.role},
            privateKey,
            {
                algorithm: "RS256",
                expiresIn: "2h",
            });
        console.log(jwt_hash);
    }

    return res.json({ success: true, token: jwt_hash});
});

// A1 - noSQLi
router.post('/api/login_safe', middleware_nosqli_fix, function(req, res, next) {
    let sess = req.session;

    user.findOne({
        $or: [{
            "username": req.body.creds.toLowerCase()
        }, {
            "email": req.body.creds.toLowerCase()
        }],
        "password": req.body.password

    }, (err, docs) => {
        if (err) console.log(err);

        if (docs == null || docs.length == 0) {
            return res.json({ success: false, msg: "username not found or wrong password"});
        }

        sess.username = docs.username;
        sess.email = docs.email;
        sess.role = docs.role;

        return res.json({ msg: `welcome ${docs.username}, role: ${docs.role}` });
    });

});

router.post('/api/login', function(req, res, next) {
    let sess = req.session;

    // "$ne":"a"
    // "$regex" "^A"

    user.findOne({
        $or: [{
            "username": req.body.creds.toLowerCase()
        }, {
            "email": req.body.creds.toLowerCase()
        }],
        "password": req.body.password

    }, (err, docs) => {
        if (err) console.log(err);

        if (docs == null || docs.length == 0) {
            return res.json({ success: false, msg: "username not found or wrong password"});
        }

        sess.username = docs.username;
        sess.email = docs.email;
        sess.role = docs.role;

        return res.json({ msg: `welcome ${docs.username}, role: ${docs.role}` });
    });

});
router.post('/api/register', function(req, res, next) {

    user.findOne({"username":"roman"}, (err, docs) => {
        if (err) console.log(err);

        if (!docs)
        {
            new user({
                username: "roman",
                email: "romanza@checkpoint.com",
                password: "IKnowSQLiInjection",
                role: "admin",
                uuid: uuid4(),
                score: 1337
            }).save();
        }

    });

    user.findOne({
        $or: [{
            "username": req.body.username.toLowerCase()
        }, {
            "email": req.body.email.toLowerCase()
        }]
    }, (err, docs) => {
        if (err) console.log(err);

        if (docs != null) {
            return res.json({ success: false, msg: "user already exists" });
        }

        if (req.body.username.length < 4 || req.body.email.length < 4 ) {
            return res.json({ success: false, msg: "data to short" });
        }

        new user({
            username: req.body.username.toLowerCase(),
            email: req.body.email.toLowerCase(),
            password: req.body.password,
            role: "user",
            uuid: uuid4()

        }).save(function (err, saved_object) {
            return res.json({ success: true ,msg: "registered successfully"});
        });
    });

});

module.exports = router;
