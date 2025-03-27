import { mock_data, updateScriptsAsync } from "../mock_data";
import express from 'express';

const router = express.Router()

//get specific 'scripts' data
router.get('/:id', async function (req, res) {
    const scriptId = req.params.id;
    console.log(scriptId);    

    const scripts = mock_data.scripts;
    let found = false;

    for (const script of scripts) {
        if (script.ID === scriptId) {
            res.json(script);
            found = true;
            break;  // Stop the loop once the response is sent
        }
    }

    if (!found) {
        res.json({ "status": 404, data: `no script was found under the id '${scriptId}'.` });
        return;
    }
});

// Endpoint to get all data
router.get('/', async (req, res) => {
    try {
        res.json(mock_data.scripts);
    } catch (err) {
        console.log("Error fetching scripts " + err.message);
    }
});

// Endpoint to add new data
router.post('/', async (req, res) => {
    try {
        const records = req.body;
        if (!Array.isArray(records) || !records.length) {
            return res.status(400).send('Records not found.');
        }

        const database = mock_data.scripts;

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

            record.ID = 'SCR-' + next.toString().padStart(6, '0');
            delete record.saving;
            next += 1;

            database.push(record);
        });

        await updateScriptsAsync(database);
        
        return res.status(200).send({ "action": "record added", "table": 'scripts', "new_ids": records.map(x => x.ID) });
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
        const database = mock_data.scripts;

        // Find index of item with given ID
        const index = database.findIndex(item => item.ID === id);

        // If item found, delete it
        if (index === -1) {
            console.log(`Item with ID ${id} not found`);
            return res.status(404).send('Id not found.');
        }

        database.splice(index, 1);
        console.log(`Item with ID ${id} deleted successfully`);

        await updateScriptsAsync(database);
    } catch (err) {
        console.log("Error while trying to delete an item: " + err.message);
        throw err;
    }
});

router.delete('/', async (req, res) => {
    try {
        console.log("Clearing the database")
        await updateScriptsAsync([]);
        mock_data.scripts = [];
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
            return res.status(404).send('Invalid Script Id received.');
        }

        //Get Data
        const database = mock_data.scripts;

        const index = database.findIndex(item => item.ID === id);

        let payloadAttributes = [];
        if (index === -1) {
            return res.status(404).send('RPA Script Not Found.');
        }
        const currentItem = database[index];
        database.splice(index, 1);
        let currentAttributes = Object.keys(currentItem);

        //check which attributes differ from the current project and the change payload
        payloadAttributes = payload.filter(x => currentAttributes.includes(x.field));

        payloadAttributes.forEach((attribute: any) => {
            attribute.old_value = currentItem[attribute.field];
            currentItem[attribute.field] = attribute.new_value;
        });

        database.push(currentItem);

        await updateScriptsAsync(database);

        //console.log('Returning Updates: ', payloadAttributes)
        return res.status(200).send({ "action": "record updated", "table": 'scripts', "updates": payloadAttributes });
    } catch (err) {
        console.log("Error while trying to update an item: " + err.message);
        throw err;
    }
});

export default router;