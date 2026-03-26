const NewTaskModule = {

init() {

const btn = document.getElementById('btnNewTask');

if(btn){

  btn.addEventListener('click',()=>{

    if(!DataStore.engagements.length){
      alert('Please create an engagement first or import via Excel.');
      return;
    }

    EngagementModule.renderEngagementSelects();
    TemplatesModule.renderTemplateDropdown();

    App.openModal('modalNewTask');

setTimeout(() => {

  const templateSelect = document.getElementById('taskTemplate');
  const container = document.getElementById('templateTaskSelector');

  if (templateSelect) {
    templateSelect.onchange = () => {

      const tmpl = DataStore.taskTemplates.find(t => t.id === templateSelect.value);

      if (!tmpl) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = `
        <div style="border:1px solid #ddd; padding:10px; border-radius:6px;">
          <strong>Select tasks:</strong>
          ${tmpl.tasks.map(task => `
            <label style="display:block;">
              <input type="checkbox" value="${task}" />
              ${task}
            </label>
          `).join('')}
        </div>
      `;
    };
  }

  const prepDiv = document.getElementById("preparerSelect");
  const revDiv = document.getElementById("reviewerSelect");

  const html = `
    <div class="multi-select">
      <div class="selected-display">Select</div>
      <div class="dropdown hidden">
        <div class="options"></div>
        <div class="actions">
          <button type="button" class="okBtn">OK</button>
          <button type="button" class="cancelBtn">Cancel</button>
        </div>
      </div>
    </div>
  `;

  prepDiv.innerHTML = html;
  revDiv.innerHTML = html;

  const prepEl = prepDiv.querySelector('.multi-select');
  const revEl = revDiv.querySelector('.multi-select');

  initExcelMultiSelect(prepEl, []);
  initExcelMultiSelect(revEl, []);

}, 100);
  });

}
  
const form=document.getElementById('formNewTask');

if(form){

form.addEventListener('submit',async(e)=>{

e.preventDefault();

const engagementId=document.getElementById('taskEngagement').value;

const templateId=document.getElementById('taskTemplate').value;

const taskName=document.getElementById('taskName').value.trim();

const prepStatus=document.getElementById('taskPrepStatus').value;

const revStatus=document.getElementById('taskRevStatus').value;

const dueDate=document.getElementById('taskDueDate').value;

const preparerEl = document.querySelector('#preparerSelect .multi-select');
const reviewerEl = document.querySelector('#reviewerSelect .multi-select');

const preparer = preparerEl?.getAttribute('data-value')
  ? JSON.parse(preparerEl.getAttribute('data-value'))
  : [];

const reviewer = reviewerEl?.getAttribute('data-value')
  ? JSON.parse(reviewerEl.getAttribute('data-value'))
  : [];
  
console.log("PREPARER:", preparer);
console.log("REVIEWER:", reviewer);
  
if(!engagementId){

alert('Engagement is required.');

return;

}

if(!templateId && !taskName){

alert('Please either select a template or enter a Task Name.');

return;

}

let createdCount=0;

if(templateId){

const tmpl=DataStore.taskTemplates.find(t=>t.id===templateId);

if(tmpl){

const checked = document.querySelectorAll('#templateTaskSelector input[type="checkbox"]:checked');

let selectedTasks = [];

if (checked.length > 0) {
  selectedTasks = Array.from(checked).map(c => c.value);
} else {
  selectedTasks = tmpl.tasks; // fallback (old behavior)
}

for(const name of selectedTasks){

await this.createTask({
  engagementId,
  taskName: name,
  preparer,
  reviewer,
  prepStatus,
  revStatus,
  dueDate
});
  
createdCount++;

}

}

}

if(taskName){

await this.createTask({
  engagementId,
  taskName: taskName,
  preparer,
  reviewer,
  prepStatus,
  revStatus,
  dueDate
});

createdCount++;

}

await DataStore.loadTasks();

TaskModule.renderTasks();

App.closeModal('modalNewTask');

form.reset();

document.getElementById('templateTaskSelector').innerHTML = '';

alert(`Created ${createdCount} task(s).`);
  
});

}

},

async createTask({engagementId,taskName,preparer,reviewer,prepStatus,revStatus,dueDate}){

const task={

id:"task_"+Date.now()+"_"+Math.floor(Math.random()*1000),

engagementId,
taskName,

preparer: preparer || [],
reviewer: reviewer || [],
  
prepStatus,
revStatus,

dueDate,
createdAt:new Date().toISOString(),
auditLog:[]

};

await DataStore.saveTask(task);

}

};
