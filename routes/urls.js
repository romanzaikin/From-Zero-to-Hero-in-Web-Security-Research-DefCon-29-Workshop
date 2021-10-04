const express = require('express');
const encode = require('html-entities').encode;
const fs = require('fs');
const uuid4 = require("uuid4");
const request = require('request');
const router = express.Router();



/* INDEX. */
router.get(['/','/index'], function(req, res, next) {

    return res.render(`index`,
        {
            title: `OWASP NODE Panel`,
        });
});

/* A10 stages. */
router.get('/a10/stage/:id', function(req, res, next) {
    switch (req.params.id) {
        case "1":
            return res.render(`a10/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });

        default:
            return res.render("a10/stage1",{title:"Stage1", stage: 1});
    }

});

/* A9 stages. */
router.get('/a9/stage/:id', function(req, res, next) {
    switch (req.params.id) {
        case "1":
        case "2":
            return res.render(`a9/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });

        default:
            return res.render("a9/stage1",{title:"Stage1", stage: 1});
    }

});

/* A8 stages. */
router.get('/a8/stage/:id', function(req, res, next) {
    switch (req.params.id) {
        case "1":
            return res.render(`a8/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });

        default:
            return res.render("a8/stage1",{title:"Stage1", stage: 1});
    }

});

/* A7 stages. */
router.get('/a7/stage/:id', function(req, res, next) {
    switch (req.params.id) {
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
            return res.render(`a7/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                    search: req.query.search,
                    callback: req.query.callback,
                    output: "not found",
                    image: req.query.image
                });

        case "7_real":
            if( req.headers.referer ? req.headers.referer.includes("stage/7") : false){
                return res.render(`a7/stage${req.params.id}`,
                    {
                        title: `Stage${req.params.id}`,
                        stage: req.params.id,
                        search: req.query.search,
                    });
            }else{
                return res.redirect("/a7/stage/7?callback=/a7/stage/7_real");
            }

        default:
            return res.render("a7/stage1",{title:"Stage1", stage: req.params.id});
    }

});

/* A6 stages. */
router.get('/a6/stage/:id', function(req, res, next) {
    let sess = req.session;
    let csrf_token = uuid4();

    switch (req.params.id) {
        case "1":
        case "4":
            return res.render(`a6/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });


        case "2":
            res.setHeader("Set-Cookie", `csrf=${csrf_token}; Path=/; HttpOnly`);
            sess.csrf = csrf_token;

            return res.render(`a6/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });

        case "3":
            sess.csrf = csrf_token;
            return res.render(`a6/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                    csrf: csrf_token
                });

        default:
            return res.render("a6/stage1",{title:"Stage1", stage: 1});
    }

});

/* A5 stages. */
router.get('/a5/stage/:id', function(req, res, next) {
    let url = "";
    let sess = req.session;

    switch (req.params.id) {
        case "1":
            fs.readFile('./views/a5/'+req.query.file, function (err, data) {

                return res.render(`a5/stage${req.params.id}`,
                    {
                        title: `Stage${req.params.id}`,
                        stage: req.params.id,
                        output: data
                    });
            });
            break;

        case "2":
            let options = {
                url:  req.query.file.includes("http") ? req.query.file : "http://127.0.0.1:3000/logs/data.log",
                timeout: 3000
            }
            //2130706433

            request.get(options, async (error, response, body) => {
                return res.render(`a5/stage${req.params.id}`,
                    {
                        title: `Stage${req.params.id}`,
                        stage: req.params.id,
                        output: body
                    });
            });
            break;

        case "3":
        case "4":
            return res.render(`a5/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                    username: sess.username
                });

        default:
            return res.render("a5/stage1",{title:"Stage1", stage: 1});
    }

});

/* A4 stages. */
router.get('/a4/stage/:id', function(req, res, next) {
    switch (req.params.id) {
        case "1":
            return res.render(`a4/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });

        default:
            return res.render("a4/stage1",{title:"Stage1", stage: 1});
    }

});

/* A3 stages. */
router.get('/a3/stage/:id', function(req, res, next) {
    switch (req.params.id) {
        case "1":
            return res.render(`a3/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });

        default:
            return res.render("a3/stage1",{title:"Stage1", stage: 1});
    }

});

/* A2 stages. */
const ascii_to_hex = (str) => {

    let arr1 = [];
    for (let n = 0, l = String(str).length; n < l; n ++)
    {
        let hex = Number(String(str).charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}


router.get('/a2/stage/:id', function(req, res, next) {
    let sess = req.session;

    switch (req.params.id) {
        case "1":
            return res.render(`a2/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });
        case "2":
            sess.anti_automation_password = ascii_to_hex(Math.floor(Math.random() * 9000) + 1000);

            return res.render(`a2/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                    password: sess.anti_automation_password
                });

        case "3":
        case "4":
            sess.anti_automation_password = ascii_to_hex(Math.floor(Math.random() * 9000) + 1000);

            return res.render(`a2/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });

        default:
            return res.render("a2/stage1",{title:"Stage1", stage: 1});
    }

});

/* A1 stages. */
router.get('/a1/stage/:id', function(req, res, next) {

    switch (req.params.id) {
        case "1":
        case "2":
        case "3":
            return res.render(`a1/stage${req.params.id}`,
                {
                    title: `Stage${req.params.id}`,
                    stage: req.params.id,
                });

        default:
            return res.render("a1/stage1",{title:"Stage1", stage: 1});
    }

});

// auth
router.get('/auth/:id', function(req, res, next) {

    switch (req.params.id) {
        case "register":
        case "login":
            return res.render(`auth/${req.params.id}`,
                {
                    title: req.params.id,
                    stage: req.params.id,
                });

        default:
            return res.render("auth/login",{title:"login", stage: 1});
    }

});

module.exports = router;
