import { mock_data, updateRankingsAsync } from "../mock_data";
import express from 'express';

const router = express.Router()

//get specific 'rpa_projects' data
router.get('/:id', async function (req, res) {
    const projectId = req.params.id;
    console.log(projectId);    

    const rankings = mock_data.rankings;
    let found = false;

    for (const ranking of rankings) {
        if (ranking.project_id === projectId) {
            res.json(ranking);
            found = true;
            break;  // Stop the loop once the response is sent
        }
    }

    if (!found) {
        res.json({ "status": 404, data: `no rankings was found under the id '${projectId}'.` });
        return;
    }
});

// Endpoint to get all data
router.get('/', async (req, res) => {
    try {
        res.json(mock_data.rankings);
    } catch (err) {
        console.log("Error fetching rankings " + err.message);
    }
});

// Endpoint to add new data
router.post('/', async (req, res) => {
    try {
        const records = req.body;
        if (!Array.isArray(records) || !records.length) {
            return res.status(400).send('Records not found.');
        }

        const database = mock_data.rankings;
        
        records.forEach(record => {
            if(!record) {
                return;
            }

            delete record.saving;
            database.push(record);
        });

        await updateRankingsAsync(database);
        
        return res.status(200).send({ "action": "record added", "table": 'rankings', "new_ids": records.map(x => x.project_id) });
    } catch (err) {
        console.log(`Error while attempting to post ${err.message}`);
        res.send(`Error while attempting to post ${err.message}`);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const project_id = req.params.id;
        console.log("id to delete: ", project_id)
        if (!project_id) {
            return res.status(404).send('Id not found.');
        }

        //Get Data
        const database = mock_data.rankings;

        // Find index of item with given ID
        const index = database.findIndex(item => item.project_id === project_id);

        // If item found, delete it
        if (index === -1) {
            console.log(`Item with ID ${project_id} not found`);
            return res.status(404).send('Id not found.');
        }

        database.splice(index, 1);
        console.log(`Item with ID ${project_id} deleted successfully`);

        await updateRankingsAsync(database);
    } catch (err) {
        console.log("Error while trying to delete an item: " + err.message);
        throw err;
    }
});

router.delete('/', async (req, res) => {
    try {
        console.log("Clearing the database")
        await updateRankingsAsync([]);
        mock_data.rankings = [];        
        res.send([]);
    } catch (err) {
        console.log("Error while clearing data" + err.message);
        throw err;
    }

});

router.put('/:id', async (req, res) => {
    try {
        const project_id = req.params.id;
        /** @type {{ field: string, new_value: any }[]} */
        const payload = req.body;
        console.log("Item to update: ", project_id)
        if (!project_id) {
            return res.status(404).send('Invalid Project Id received.');
        }

        //Get Data
        const database = mock_data.rankings;

        const index = database.findIndex(item => item.project_id === project_id);

        let payloadAttributes = [];
        if (index === -1) {
            return res.status(404).send('Ranking Not Found.');
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

        await updateRankingsAsync(database);

        //console.log('Returning Updates: ', payloadAttributes)
        return res.status(200).send({ "action": "record updated", "table": 'rankings', "updates": payloadAttributes });
    } catch (err) {
        console.log("Error while trying to update an item: " + err.message);
        throw err;
    }
});

router.put('/', async (req, res) => {
    try {
        /** @type {{ field: string, new_value: any }[]} */
        const payload: Ranking[] = req.body;
        console.log("Item to update: ", payload)
        if (!payload?.length) {
            return res.status(404).send('Invalid payload received.');
        }

        mock_data.rankings = payload;

        await updateRankingsAsync(mock_data.rankings);

        return res.status(200).send({ "action": "record updated", "table": 'rankings', "updates": mock_data.rankings });
    } catch (err) {
        console.log("Error while trying to update an item: " + err.message);
        throw err;
    }
});

export default router;