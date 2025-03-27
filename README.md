# PO&A Project Monitor - WALDO
Working with RPA leadership and Optimization team to create a dashboard and project/program management tool that allows leaders to more easily track and edit project status and deliverables.

Leveraging <a href="https://developers.google.com/apps-script/">Google Apps Script</a>, <a href="https://parceljs.org/recipes/react/" target="_blank">Parcel</a>, <a href="https://developers.google.com/apps-script/guides/clasp" target="_blank">Clasp</a>, and <a href="https://react.dev/learn">React</a> to create the Web App.

## Structure and Design
The application is split into a number of sub-folders.
* `src/` contains any code related to the published google apps scripts code itself. Serves the React App to the user and communicates with the WALDO API.
* `src_react/` contains all of the code for the React App itself.
* `src_dev/` contains a mock api that roughly approximates what the WALDO API returns to us. Used when `npm run devlocal` is called.
* `src_shared/` contains code that is shared between the src_react/ and src_dev/.

Statuses and Stages are hard-coded objects currently, but are meant to be used in a data-driven way. They live in `src_shared/AppConstants.ts`. Anything that uses statuses or stages should reference these fixed instances.
* The `id` field is used for saving to the database and data comparisons. The `title` field exists so we can safely change the display name of the status or stage without needing to change the database values.

## Getting Started
For any new features or bugs, always make sure to start a new branch off of development. Preferably, prefix the branch with either "feature/" or "fix/", and then the name of the branch. The name could be the name of the feature or fix, your name and date, doesn't matter as long as it's prefixed accordingly.

### Running locally

#### 1.) Install dependencies first
<pre><code>npm install</code></pre>

#### 2.) Connect to clasp (Only required once per machine)
<pre><code>npm run gin</code></pre>
<p>or</p>
<pre><code>clasp login</code></pre>

#### 3.) Run Dev
<pre><code>npm run devlocal</code></pre>
This clears the parcel cache (<a href="https://parceljs.org/recipes/react/" target="_blank">visit here for more info</a>) then starts the frontend (localhost:1234) and runs the server (localhost:1235). After which open http://localhost:1234/

### Testing in Apps Scripts, Merging Up, and Publishing
Once you have your feature or fix working locally, the next step is to test it on the Test deployment in google apps scripts. This deployment is a free-for-all; it can and will be replaced by someone else and shouldn't be trusted to remain unchanged, it is just for quickly testing your changes in google.
<pre><code>npm run publish_test</code></pre>

After you've successfully tested your changes in the Test deployment, the next step is to make a PR from your branch to the development branch. Ensure to add another developer as a reviewer in the PR. After the PR is approved and merged, switch to the development branch and publish to the Dev deployment using the below command. This command should only ever be done from the development branch; avoid publishing to Dev from a non-development branch.
<pre><code>npm run publish_dev</code></pre>

The Dev deployment is to be used for the bi-weekly show-and-tell meeting for WALDO. Assuming all features are approved during that meeting, then we do another PR from development to main which can be immediately merged, no reviewer is required. After it is merged to main, switch to main and publish to the Prod deployment using the following command:
<pre><code>npm run publish_prod</code></pre>

Finally, switch back to the development branch and directly merge main into development, just so the commit history is up to date.

### Test/Dev Database
The Test and Dev deployments use a copy of the google spreadsheets so that you are safe to make changes there without fear of messing up production data. These copies can be found in the "PO&A Project Monitor" Shared Drive, under Datatables_Dev. If you need to refresh the spreadsheets from the production data, because you broke data or the spreadsheets had new columns added, within that folder is a Refresh Tables script, open it up and run the "copyFolder" or similarly name function, and it will copy all of the data from production to the dev spreadsheets, as well as create any new spreadsheets.

### Connect to a Google App Script Container
If a Google App Script Container does not already exist, create one else skip to step 6:

#### 4.) Create a Google app script and copy the id i.e. 
![Screenshot 2023-11-28 202111](https://github.com/GSA-RPA/project-monitor/assets/51139836/26b960e5-3987-423f-a052-2625d51fb479)

#### 5.) Open the .clasp.json file in the root directory and paste in the attribute "scriptId" 
![Screenshot 2023-11-28 202226](https://github.com/GSA-RPA/project-monitor/assets/51139836/42e5fcd1-e049-444f-9a08-ed2bbb02b42d)

#### 6.) Run this command to push the local build to the Google App Script container
<pre><code>clasp push</code></pre>

#### 7.) To view the Web App go to the Google App Script Container's Editor and select Deploy > New Deployment 
![Screenshot 2024-03-03 213717](https://github.com/GSA-RPA/project-monitor/assets/51139836/548e4db6-14ad-4301-938d-8f3ad1b3e718)