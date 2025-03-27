import { milestoneFields, mock_data, updateMilestonesAsync } from "../mock_data";
import express from 'express';

const router = express.Router()

router.get('/:id', async (req, res) => {
    const refId = req.params.id;
    //console.log("rpaID: ", refId);

    try {

        const milestonesDt = mock_data.milestones;
        let milestoneFound = null;

        for (const milestone of milestonesDt) {
            if (milestone.ref_id === refId) {
                milestoneFound = milestone;
                break;
            }
        }

        if (milestoneFound) {
            res.json(milestoneFound);
        } else {
            res.status(400).json({ "status": 400, data: `No RPA project was found under the ID '${refId}'.` });
        }
    } catch (err) {
        console.error("Error fetching milestones: " + err.message);
        res.status(500).send('Error processing request');
    }
});

router.get('/', async (req, res) => {
    try {
        let database = mock_data.milestones;
        return res.status(201).send(database);
    } catch (err) {
        console.log("Error fetching milestones " + err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const records = req.body as MilestoneProcessed[];
        if (!Array.isArray(records) || !records.length) {
            return res.status(400).send('Records not found.');
        }        

        let database = mock_data.milestones;

        let next = database.reduce((prev, record) => {
            const id = record.ID?.split('-')[1];
            if(!id) {
                return prev;
            }
            let num = parseInt(id, 10);
            if(Number.isNaN(num)) {
                num = 0;
            }

            return Math.max(prev, num);
        }, 0) + 1;
        
        records.forEach(record => {
            if(!record || !record.ref_id) {
                console.error("Milestone is null or missing required fields.")
                return;
            }

            record.ID = 'MS-' + next.toString().padStart(10, '0');
            delete record.saving;
            next += 1;

            database.push(record);
        });

        // Place updated data into the file (database)
        await updateMilestonesAsync(database);

        return res.status(200).json({"action": "new record added", "table": 'rpa_milestones', "new_ids": records.map(x => x.ID) })
    } catch (err) {
        console.log(`Error while attempting to post to milestones ${err.message}`);
        res.status(500).send(`Error while attempting to post to milestones ${err.message}`);
    }
});

router.put('/:id', async (req, res) => {
    const milestoneId = req.params.id;
    const payload = req.body;
    console.log("update milestone w/ milestoneId: ", milestoneId);
    let database = mock_data.milestones;
    
    const index = database.findIndex(item => item.ID === milestoneId);

    let payloadAttributes = [];
    console.log('Index: ', index)
    if (index === -1) {
        console.log("milestone " + milestoneId + " was not found");
        return res.status(404).send("milestone " + milestoneId + " was not found");
    }
    
    const currentItem = database[index];
    database.splice(index, 1);
    console.log('Milestone Fields: ', milestoneFields, 'payload: ', payload)

    //check which attributes differ from the current project and the change payload
    payloadAttributes = payload.filter(x => milestoneFields.includes(x.field));

    payloadAttributes.forEach((attribute) => {            
        attribute.old_value = currentItem[attribute.field];
        currentItem[attribute.field] = attribute.new_value;
    });

    database.push(currentItem);

    updateMilestonesAsync(database);

    return res.status(200).send({ "action": "record updated", "table": 'rpa_milestones', "updates": payloadAttributes });
});

export default router;