import { mock_data, updateBugsAsync } from "../mock_data";
import express from 'express';

const router = express.Router()

//get specific 'rpa_projects' data
router.get('/:id', async function (req, res) {
    const bugId = req.params.id;
    console.log(bugId);    

    const bugs = mock_data.bugs;
    let found = false;

    for (const bug of bugs) {
        if (bug.ID === bugId) {
            res.json(bug);
            found = true;
            break;  // Stop the loop once the response is sent
        }
    }

    if (!found) {
        res.json({ "status": 404, data: `no bugs was found under the id '${bugId}'.` });
        return;
    }
});

// Endpoint to get all data
router.get('/', async (req, res) => {
    try {
        res.json(mock_data.bugs);
    } catch (err) {
        console.log("Error fetching bugs " + err.message);
    }
});

// Endpoint to add new data
router.post('/', async (req, res) => {
    try {
        const records = req.body;
        if (!Array.isArray(records) || !records.length) {
            return res.status(400).send('Records not found.');
        }

        const database = mock_data.bugs;

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
            if(!record) {
                return;
            }

            record.ID = 'BUG-' + next.toString().padStart(6, '0');
            delete record.saving;
            next += 1;

            database.push(record);
        });

        await updateBugsAsync(database);
        
        return res.status(200).send({ "action": "record added", "table": 'bugs', "new_ids": records.map(x => x.ID) });
    } catch (err) {
        console.log(`Error while attempting to post ${err.message}`);
        res.send(`Error while attempting to post ${err.message}`);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log("id to delete: ", id)
        if (!id) {
            return res.status(404).send('Id not found.');
        }

        //Get Data
        const database = mock_data.bugs;

        // Find index of item with given ID
        const index = database.findIndex(item => item.ID === id);

        // If item found, delete it
        if (index === -1) {
            console.log(`Item with ID ${id} not found`);
            return res.status(404).send('Id not found.');
        }

        database.splice(index, 1);
        console.log(`Item with ID ${id} deleted successfully`);

        await updateBugsAsync(database);
    } catch (err) {
        console.log("Error while trying to delete an item: " + err.message);
        throw err;
    }
});

router.delete('/', async (req, res) => {
    try {
        console.log("Clearing the database")
        await updateBugsAsync([]);
        mock_data.bugs = [];        
        res.send([]);
    } catch (err) {
        console.log("Error while clearing data" + err.message);
        throw err;
    }

});

router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        /** @type {{ field: string, new_value: any }[]} */
        const payload = req.body;
        console.log("Item to update: ", id)
        if (!id) {
            return res.status(404).send('Invalid RPA Id received.');
        }

        //Get Data
        const database = mock_data.bugs;

        const index = database.findIndex(item => item.ID === id);

        let payloadAttributes = [];
        if (index === -1) {
            return res.status(404).send('Bug Not Found.');
        }        
        const currentItem = database[index];
        database.splice(index, 1);
        let currentAttributes = Object.keys(currentItem);

        //check which attributes differ from the current project and the change payload
        payloadAttributes = payload.filter(x => currentAttributes.includes(x.field));

        payloadAttributes.forEach((attribute) => {
            attribute.old_value = currentItem[attribute.field];
            currentItem[attribute.field] = attribute.new_value;
        });

        database.push(currentItem);

        await updateBugsAsync(database);

        //console.log('Returning Updates: ', payloadAttributes)
        return res.status(200).send({ "action": "record updated", "table": 'bugs', "updates": payloadAttributes });
    } catch (err) {
        console.log("Error while trying to update an item: " + err.message);
        throw err;
    }
});

export default router;