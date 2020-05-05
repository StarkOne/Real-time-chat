const router = require('express').Router()

router.get('/', (req, res) => {
    res.send('server is work')
})

module.exports = router;
