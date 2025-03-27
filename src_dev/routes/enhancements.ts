import { CreateMockRpas, mock_data, updateEnhancementsAsync, updateRpasAsync } from "../mock_data";
import express from 'express';

const router = express.Router()

//get specific 'rpa_projects' data
router.get('/:id', async function (req, res) {
    const enhId = req.params.id;
    //console.log(enhId);    

    const enhancements = mock_data.enhancements;
    let found = false;

    for (const enh of enhancements) {
        if (enh.ID === enhId) {
            res.json(enh);
            found = true;
            break;  // Stop the loop once the response is sent
        }
    }

    if (!found) {
        res.json({ "status": 404, data: `no enhancement was found under the id '${enhId}'.` });
        return;
    }
});

// Endpoint to get all data
router.get('/', async (req, res) => {
    try {
        res.json(mock_data.enhancements);
    } catch (err) {
        console.log("Error fetching enhancements " + err.message);
    }
});

// Endpoint to add new data
router.post('/', async (req, res) => {
    try {
        const records = req.body;
        if (!Array.isArray(records) || !records.length) {
            return res.status(400).send('Records not found.');
        }

        const database = mock_data.enhancements;

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

            record.ID = 'ENH-' + next.toString().padStart(6, '0');
            delete record.saving;
            next += 1;

            database.push(record);
        });

        await updateEnhancementsAsync(database);
        
        return res.status(200).send({ "action": "record added", "table": 'enhancements', "new_ids": records.map(x => x.ID) });
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
        const database = mock_data.enhancements;

        // Find index of item with given ID
        const index = database.findIndex(item => item.ID === id);

        // If item found, delete it
        if (index === -1) {
            console.log(`Item with ID ${id} not found`);
            return res.status(404).send('Id not found.');
        }

        database.splice(index, 1);
        console.log(`Item with ID ${id} deleted successfully`);

        await updateEnhancementsAsync(database);
    } catch (err) {
        console.log("Error while trying to delete an item: " + err.message);
        throw err;
    }
});

router.delete('/', async (req, res) => {
    try {
        console.log("Clearing the database")
        await updateEnhancementsAsync([]);
        mock_data.enhancements = [];        
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
            return res.status(404).send('Invalid Id received.');
        }

        //Get Data
        const database = mock_data.enhancements;

        const index = database.findIndex(item => item.ID === id);

        let payloadAttributes = [];
        if (index === -1) {
            return res.status(404).send('Enhancement Not Found.');
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

        await updateEnhancementsAsync(database);

        //console.log('Returning Updates: ', payloadAttributes)
        return res.status(200).send({ "action": "record updated", "table": 'enhancements', "updates": payloadAttributes });
    } catch (err) {
        console.log("Error while trying to update an item: " + err.message);
        throw err;
    }
});

export default router;