const AllocationsDAO = require("../data/allocations-dao").AllocationsDAO;
const {
    environmentalScripts
} = require("../../config/config");

function AllocationsHandler(db) {
    "use strict";

    const allocationsDAO = new AllocationsDAO(db);

    this.displayAllocations = (req, res, next) => {
        const {
            userId
        } = req.session;
        const {
            threshold
        } = req.query;

        let parsedThreshold;
        if (threshold) {
            parsedThreshold = parseInt(threshold, 10);
            if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 99) {
                return res.status(400).render("allocations", {
                    userId,
                    allocations: [],
                    environmentalScripts,
                    updateError: "Threshold must be a number between 0 and 99"
                });
            }
        }

        allocationsDAO.getByUserIdAndThreshold(userId, parsedThreshold, (err, allocations) => {
            if (err) return next(err);
            return res.render("allocations", {
                userId,
                allocations,
                environmentalScripts
            });
        });
    };
}

module.exports = AllocationsHandler;
