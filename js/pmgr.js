"use strict"

import * as Pmgr from './pmgrapi.js'

/**
 * Librería de cliente para interaccionar con el servidor de PrinterManager (prmgr).
 * Prácticas de IU 2020-21
 *
 * Para las prácticas de IU, pon aquí (o en otros js externos incluidos desde tus .htmls) el código
 * necesario para añadir comportamientos a tus páginas. Recomiendo separar el fichero en 2 partes:
 * - funciones que pueden generar cachos de contenido a partir del modelo, pero que no
 *   tienen referencias directas a la página
 * - un bloque rodeado de $(() => { y } donde está el código de pegamento que asocia comportamientos
 *   de la parte anterior con elementos de la página.
 *
 * Fuera de las prácticas, lee la licencia: dice lo que puedes hacer con él, que es esencialmente
 * lo que quieras siempre y cuando no digas que lo escribiste tú o me persigas por haberlo escrito mal.
 */

//
// PARTE 1:
// Código de comportamiento, que sólo se llama desde consola (para probarlo) o desde la parte 2,
// en respuesta a algún evento.
//



class InterfaceState {
  constructor(ciSelectedJobId, ciSearchInput, imSelectedPrinterId, imFilters, grSelectedGroupId, grSearchInput, grFilters) {
    // State of Cola de Impresion tab
    this.ciSelectedJobId = ciSelectedJobId;
    this.ciSearchInput = ciSearchInput;

    // State of Impresoras tab
    this.imSelectedPrinterId = imSelectedPrinterId;
    this.imFilters = imFilters || [];

    // State of Grupos tab
    this.grSelectedGroupId = grSelectedGroupId;
    this.grSearchInput = grSearchInput;
    this.grFilters = grFilters;

  }
}

class Filter {
  constructor(type, value, buttonId) {
    this.type = type;
    this.value = value;
    this.buttonId = buttonId;   // To relate each filter with its button (used when button is clicked to remove filter)
  }
}

const FilterTypes = {
  NOMBRE: 'Nombre',
  IP: 'IP',
  MODELO: 'Modelo',
  LOCALIZACION: 'Localización',
  GRUPO: 'Grupo'
}

function getFilterTypeByIdx(idx) {
  switch (Number(idx)) {
    case 0: return FilterTypes.NOMBRE; break;
    case 1: return FilterTypes.IP; break;
    case 2: return FilterTypes.MODELO; break;
    case 3: return FilterTypes.LOCALIZACION; break;
    case 4: return FilterTypes.GRUPO; break;
  }
}

let interfaceState = undefined;  // Initialized on update(), declared here for global access 

// Asign actions to buttons (nasty global implementation):
document.getElementById("imIzFilterBtn").addEventListener("click", addImFilter);

function addImFilter() {
  var inputText = document.getElementById("imIzFilterInput").value;
  var filterTypeIdx = document.getElementById("imIzFilterType").value;

  let filter = new Filter(getFilterTypeByIdx(filterTypeIdx), inputText, Math.floor(Math.random() * 1000000));

  interfaceState.imFilters.push(filter);

  //console.log("Filtro añadido. Tipo:" + getFilterTypeByIdx(filterTypeIdx) + " Valor: " + inputText);
  update();
}

function removeImFilter(button) {
  let idx = interfaceState.imFilters.indexOf(interfaceState.imFilters.find((f) => f.buttonId == button.id));
  if (idx > -1) {
    interfaceState.imFilters.splice(idx, 1);
  }
  update();
}

function applyImFilters() {
  if (interfaceState != undefined && interfaceState.imFilters.length > 0) {
    let filteredList = Pmgr.globalState.printers;
    let filters = interfaceState.imFilters;

    for (let i = 0; i < filters.length; i++) {
      switch (filters[i].type) {
        case FilterTypes.NOMBRE:
          filteredList = filteredList.filter((p) => p.alias == filters[i].value);
          break;
        case FilterTypes.IP:
          filteredList = filteredList.filter((p) => p.ip == filters[i].value);
          break;
        case FilterTypes.MODELO:
          filteredList = filteredList.filter((p) => p.model == filters[i].value);
          break;
        case FilterTypes.LOCALIZACION:
          filteredList = filteredList.filter((p) => p.location == filters[i].value);
          break;
        case FilterTypes.GRUPO:
          filteredList = filteredList.filter((p) => p.group == filters[i].value);
          break;
      }
    }

    // To update the right panel:
    if (filteredList.length > 0) { interfaceState.imSelectedPrinterId = filteredList[0].id; }
    else { interfaceState.imSelectedPrinterId = -1; }

    return filteredList;
  }
  else {
    return Pmgr.globalState.printers;
  }
}

function addGrSearchInput() {
  let input = document.getElementById("grSearchInput").value;
  interfaceState.grSearchInput = input;
  update();
}

function applyGrSearch() {
  if (interfaceState != undefined && interfaceState.grSearchInput != "") {
    let filteredList = Pmgr.globalState.groups;
    filteredList = filteredList.filter((g) => g.name.includes(interfaceState.grSearchInput));

    // To update the right panel:
    if (filteredList.length > 0) { interfaceState.grSelectedGroupId = filteredList[0].id; }
    else { interfaceState.grSelectedGroupId = -1; }

    return filteredList;
  }
  else {
    return Pmgr.globalState.groups;
  }
}

function addCiSearchInput() {
  let input = document.getElementById("ciSearchInput").value;
  interfaceState.ciSearchInput = input;
  update();
}

function applyCiSearch() {
  if (interfaceState != undefined && interfaceState.ciSearchInput != "") {
    let filteredList = Pmgr.globalState.jobs;
    filteredList = filteredList.filter((j) => j.fileName.includes(interfaceState.ciSearchInput));

    // To update the right panel:
    if (filteredList.length > 0) { interfaceState.ciSelectedJobId = filteredList[0].id; }
    else { interfaceState.ciSelectedJobId = -1; }

    return filteredList;
  }
  else {
    return Pmgr.globalState.jobs;
  }
}


function updateImIzFiltros() {
  $("#imIzFilterList").empty();
  let filters = interfaceState.imFilters;

  for (let i = 0; i < filters.length; i++) {
    $("#imIzFilterList").append(
      `
      <button type="button" class="btn btn-secondary btn-sm filter-btn-space" id="${filters[i].buttonId}" onclick="removeImFilter(this)">
        ${filters[i].type}: <b>${filters[i].value}</b> ×
      </button>
      `
    );
  }
}


function statusToSVG(state, desiredSize) {
  const PS = Pmgr.PrinterStates;
  switch (state) {
    case 'PRINTING':
      // Source: https://icons.getbootstrap.com/
      return `
      <svg width="${desiredSize}em" height="${desiredSize}em" viewBox="0 0 16 16" class="bi bi-printer-fill"
          fill="dark" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2H5z" />
        <path fill-rule="evenodd"
            d="M11 9H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z" />
        <path fill-rule="evenodd"
            d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2V7zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
      </svg> <!-- icono impresora -->
      `;
      break;

    case 'PAUSED':
      // Source: https://icons.getbootstrap.com/
      return `
      <svg width="${desiredSize}em" height="${desiredSize}em" viewBox="0 0 16 16" class="bi bi-pause-fill" 
          fill="dark" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
      </svg>  <!-- icono paused -->
          `;
      break;

    case 'NO_INK':
      // Source: https://icons.getbootstrap.com/
      return `
      <svg width="${desiredSize}em" height="${desiredSize}em" viewBox="0 0 16 16" class="bi bi-droplet-half" 
          fill="dark" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M7.21.8C7.69.295 8 0 8 0c.109.363.234.708.371 1.038.812 1.946 2.073 3.35 3.197 4.6C12.878 7.096 14 8.345 14 10a6 6 0 0 1-12 0C2 6.668 5.58 2.517 7.21.8zm.413 1.021A31.25 31.25 0 0 0 5.794 3.99c-.726.95-1.436 2.008-1.96 3.07C3.304 8.133 3 9.138 3 10c0 0 2.5 1.5 5 .5s5-.5 5-.5c0-1.201-.796-2.157-2.181-3.7l-.03-.032C9.75 5.11 8.5 3.72 7.623 1.82z"/>
        <path fill-rule="evenodd" d="M4.553 7.776c.82-1.641 1.717-2.753 2.093-3.13l.708.708c-.29.29-1.128 1.311-1.907 2.87l-.894-.448z"/>
      </svg>  <!-- icono no-ink -->
          `;
      break;

    case 'NO_PAPER':
      // Source: https://icons.getbootstrap.com/
      return `
      <svg width="${desiredSize}em" height="${desiredSize}em" viewBox="0 0 16 16" class="bi bi-file-earmark-excel-fill" 
          fill="dark" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M2 2a2 2 0 0 1 2-2h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm7.5 1.5v-2l3 3h-2a1 1 0 0 1-1-1zM5.884 6.68a.5.5 0 1 0-.768.64L7.349 10l-2.233 2.68a.5.5 0 0 0 .768.64L8 10.781l2.116 2.54a.5.5 0 0 0 .768-.641L8.651 10l2.233-2.68a.5.5 0 0 0-.768-.64L8 9.219l-2.116-2.54z"/>
      </svg> 
          `;
      break;

    default:

  }
}

// Return the list of printers that belong to the given group
function getGroupPrinters(group) {
  return group.printers.map((pId) => Pmgr.globalState.printers.find((p) => p.id == pId));
}

function getGroupPrintersNot(group) {
  //return Pmgr.globalState.printers.map((pId) => group.printers.find((p) => p != pId.id));
  //return group.printers.map((pId) => Pmgr.globalState.printers.find((p) => p.id != pId));
  //return Pmgr.globalState.printers.filter((g) => g.printers.indexOf(printer.id) <= -1);
  let todas = Pmgr.globalState.printers;
  let lasqueno = group;

  for (let i = 0; i < lasqueno.length; i++) {
    let id = todas.indexOf(lasqueno[i]);
    todas.splice(id, 1);
  }

  return todas;
}

// Return the list of groups that the given printer is in
function getPrinterGroups(printer) {
  return Pmgr.globalState.groups.filter((g) => g.printers.indexOf(printer.id) > -1);
}

function getPrinterGroupsNot(printer) {
  return Pmgr.globalState.groups.filter((g) => g.printers.indexOf(printer.id) <= -1);
}

// Return the list of jobs that the given printer has in the queue
function getPrinterJobs(printer) {
  return printer.queue.map((jId) => Pmgr.globalState.jobs.find((j) => j.id == jId));
}

function createPrinterItem(printer) {
  const rid = 'x_' + Math.floor(Math.random() * 1000000);
  const hid = 'h_' + rid;
  const cid = 'c_' + rid;

  let printerJobs = getPrinterJobs(printer);
  let printerJobsFormatted;

  if (printerJobs.length <= 5) {
    printerJobsFormatted = printerJobs
      .map((j) => `<span class="badge badge-secondary">${j.fileName}</span>`)
      .join(" ");
  }
  else {
    let numExtra = printerJobs.length - 5;

    printerJobsFormatted = printerJobs
      .slice(0, 5)
      .map((j) => `<span class="badge badge-secondary">${j.fileName}</span>`)
      .join(" ");

    printerJobsFormatted += (` <span class="badge badge-secondary">${"+" + numExtra}</span>`);
    /* Explanation:
        - slice => returns subarray from 0 to 5 (discard the rest of the jobs)
        - map   => takes each item (a job) and puts the job fileName in html
        - join  => converts array of html items into a single string of html
        - +=    => inserts the last element (the "+numExtra") as a string to the long html string
    */
  }

  return `
    <div class="card">
      <div class="card-header" id="${printer.id}" onclick="updateImDer(${printer.id})">
        <h2 class="mb-0">
        <button class="btn w-100" type="button"
                data-toggle="collapse" data-target="#${cid}",
                aria-expanded="false" aria-controls="#${rid}">
          <div class="row w-100 ">
            <div class="col h-100 my-auto">
              <h3>
                <div class="pcard">
                  ${printer.alias}
                </div>
              </h3>
            </div>

            <div class="col h-100 my-auto">  
              <div class="float-right">            
                  ${statusToSVG(printer.status, 2)}
              </div>
            </div>
          </div>
        </button>
        </h2>
      </div>

      <div id="${cid}" class="collapse hide" aria-labelledby="${hid}
        data-parent="#imIzLista">
        <div class="card-body pcard">
          ${printerJobsFormatted}
        </div>
      </div>
    </div >
        `;
}
/*
En el campo se le añade algo para que cuando ese campo se modifique realice un update para validarlo. Si no es valido se le pone un valor 
a un parámetro (onsubmit creo) a false(o algo asi) lo que hace que cualquier boton de submit se desactive(esto creo que es automatico no lo tenemos que hacer nosotros)
 y podemos aprovechar para mostrar cual es la razon por la que no se permite subir el contenido de los campos
*/
function addPrinter() {
  let nombre = $("#inputNuevoNombreImp").val();
  let ip = $("#inputNuevaIP").val();
  let localizacion = $("#inputNuevaLocalizacion").val();
  let modelo = $("#inputNuevoModelo").val();
  let o = { alias: nombre, ip, location: localizacion, model: modelo, status: 'paused' };
  // faltaría validar -- por ejemplo, la IP
  let valid = true;
  if (valid) {
    Pmgr.addPrinter(o).then(update);
    $("#dialogoNuevaImpresora").modal('toggle');
  }



}

function addGroup() {
  let nombre = $("#inputNewGroupName").val();
  Pmgr.addGroup({ name: nombre }).then(update);
  $("#dialogoNuevoGrupo").modal('toggle');
}

function addJob() {


  let nombre = $("#inputNewFileName").val();
  nombre = nombre.split(/(\\|\/)/g).pop();
  let propietario = $("#inputNewFileOwner").val();
  if (propietario == "") {
    document.getElementById("inputNewFileOwner").classList.add('placeholder-red');
    return;
  }
  //let impresora = $("#inputNewFilePrinter").val();

  // Get selected printer OR first printer of selected group
  let selectIdx = $("#ciPopUpSelect").val();
  let printerId;
  if (selectIdx < Pmgr.globalState.printers.length) {
    printerId = Pmgr.globalState.printers[selectIdx].id;
  }
  else {
    let group = Pmgr.globalState.groups[selectIdx - Pmgr.globalState.printers.length];
    if (group.printers.length > 0) {
      printerId = group.printers[0];
    }
    else {
      //VALIDITY error
      console.log("El grupo " + group.name + " no tiene impresoras");
    }
  }

  Pmgr.addJob({ fileName: nombre, owner: propietario, printer: printerId }).then(update);
  $("#dialogoNuevaImpresion").modal('toggle');

}

function printerIsOnGroup(printerName, groupName) {
  for (var i = 0; i < Pmgr.globalState.groups.length; i++) {
    if (Pmgr.globalState.groups[i].name == groupName) {
      for (var j = 0; j < Pmgr.globalState.groups[i].printers.length; j++) {
        if (Pmgr.globalState.groups[i].printers[j].name == printerName) {
          return true;
        }
      }
    }
  }
  return false;
}

function addPrintertoGroup2(groupId) {
  //console.log("Boton pulsado. Id: " + printerId);

  let currentGroup = Pmgr.globalState.groups.find((g) => g.id == groupId);

  currentGroup.printers.push(interfaceState.imSelectedPrinterId);

  Pmgr.setGroup(currentGroup).then(update);

}

function rmPrinterfromGroup2(groupId) {

  let currentGroup = Pmgr.globalState.groups.find((g) => g.id == groupId);

  let printerObject = Pmgr.globalState.printers.find((p) => p.id == interfaceState.imSelectedPrinterId);

  let id = currentGroup.printers.indexOf(printerObject);

  currentGroup.printers.splice(id, 1);

  Pmgr.setGroup(currentGroup).then(update);

}


function addPrintertoGroup(printerId) {
  //console.log("Boton pulsado. Id: " + printerId);

  let currentGroup = Pmgr.globalState.groups.find((g) => g.id == interfaceState.grSelectedGroupId);

  currentGroup.printers.push(printerId);

  Pmgr.setGroup(currentGroup).then(update);

}

function rmPrinterfromGroup(printerId) {

  let currentGroup = Pmgr.globalState.groups.find((g) => g.id == interfaceState.grSelectedGroupId);

  let printerObject = Pmgr.globalState.printers.find((p) => p.id == printerId);

  let id = currentGroup.printers.indexOf(printerObject);

  currentGroup.printers.splice(id, 1);

  Pmgr.setGroup(currentGroup).then(update);

}

function createJobItem(job) {

  let totalPrinters = Pmgr.globalState.printers;
  let printing;

  for (let ij = 0; ij < totalPrinters.length; ij++) {
    if (totalPrinters[ij].id == job.printer) {
      printing = totalPrinters[ij].queue[0] == job.id;
    }
  }

  return `
      <div class="card" id="${job.id}" onclick="updateCiDer(${job.id})">
        <div class="row">
            <div class="col-9">
            ${job.fileName}
            </div>
            ${printing ? `
              <div class="col">
                  <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-printer-fill"
                                    fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2H5z" />
                                    <path fill-rule="evenodd"
                                        d="M11 9H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z" />
                                    <path fill-rule="evenodd"
                                        d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2V7zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
                  </svg> <!-- icono impresora -->
                </div>`: " "
    }
               
            
        </div>
    </div>
  `;
}

function createGroupItem(group) {
  const rid = 'x_' + Math.floor(Math.random() * 1000000);
  const hid = 'h_' + rid;
  const cid = 'c_' + rid;

  let groupPrinters = getGroupPrinters(group);
  let groupPrintersFormatted;

  if (groupPrinters.length <= 5) {

    groupPrintersFormatted = groupPrinters
      .map((j) => `<span class="badge badge-secondary">${j.alias}</span>`)
      .join(" ");
  }
  else {
    let numExtra = groupPrinters.length - 5;

    groupPrintersFormatted = groupPrinters
      .slice(0, 5)
      .map((j) => `<span class="badge badge-secondary">${j.alias}</span>`)
      .join(" ");

    groupPrintersFormatted += (` <span class="badge badge-secondary">${"+" + numExtra}</span>`);
  }

  return `
    <div class="card">
      <div class="card-header" id="${group.id}" onclick="updateGrDer(${group.id})">
        <h2 class="mb-0">
        <button class="btn w-100" type="button"
                data-toggle="collapse" data-target="#${cid}",
                aria-expanded="false" aria-controls="#${rid}">
          <div class="row w-100 ">
            <div class="col h-100 my-auto">
              <h3>
                <div class="pcard">
                  ${group.name}
                </div>
              </h3>
            </div>
          </div>
        </button>
        </h2>
      </div>

      <div id="${cid}" class="collapse hide" aria-labelledby="${hid}
        data-parent="#imIzLista">
        <div class="card-body pcard">
          ${groupPrintersFormatted}
        </div>
      </div>
    </div >
        `;

}

function updateCiDer(jobId) {

  let job = Pmgr.globalState.jobs.find((j) => j.id == jobId);

  if (job == undefined) {       // Error message when there's no job to be displayed
    $("#ciDerDatos").html(
      ` <b>Ningun trabajo seleccionado</b>  `);

    interfaceState.ciSelectedJobId = -1;
    return;
  }

  interfaceState.ciSelectedJobId = job.id;   // Keep track of the selected job 

  // Guess if job is being printed at the moment:
  let totalPrinters = Pmgr.globalState.printers;
  let printing;

  for (let i = 0; i < totalPrinters.length; i++) {
    if (totalPrinters[i].id == job.printer && totalPrinters[i].queue.length > 0) {
      printing = totalPrinters[i].queue[0] == job.id;
    }
  }

  $("#ciDerDatos").html(
    `<div class="col-6" align="center">
          <div class="row-4" style="font-size:xxx-large;">
          ${printing ? `
              <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-printer-fill"
                  fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2H5z" />
                  <path fill-rule="evenodd"
                      d="M11 9H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z" />
                  <path fill-rule="evenodd"
                      d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2V7zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
              </svg> <!-- icono impresora -->
          `: ""}
              <!-- nombre archivo -->
              ${job.fileName}
          </div>
          <div class="row-4" style="font-size:x-large;">
              ID: ${job.id}
              <br>Propietario: ${job.owner}
              <br>Impresora: ${job.printer}
          </div>
          <div class="row-4">
              <br><button class="btn btn-primary" type="button" data-toggle="modal"
                  data-target="#dialogoCancelarImpresión${job.id}">Cancelar impresión</button>

              <div class="modal fade" id="dialogoCancelarImpresión${job.id}" tabindex="-1"
                  role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                  <div class="modal-dialog" role="document">
                      <div class="modal-content">
                          <div class="modal-header">
                              <h5 class="modal-title" id="exampleModalLabel">
                                  Cancelar la impresión ${job.fileName}</h5>
                              <button type="button" class="close" data-dismiss="modal"
                                  aria-label="Close">
                                  <span aria-hidden="true">&times;</span>
                              </button>
                          </div>
                          <div class="modal-body">
                              <form class="form-inline">
                                  <h6> ¿Estás seguro/a de que deseas cancelar el
                                      trabajo ${job.fileName}?
                                  </h6>

                              </form>
                          </div>
                          <div class="modal-footer">
                              <button type="button" class="btn btn-secondary"
                                  data-dismiss="modal">Atrás</button>
                              <button type="button" class="btn btn-danger" onclick="eliminarTrabajo(${job.id})">Cancelar
                                  impresión </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      <!-- pdf embed -->
      <div class="col-6">
          <div class="embed-responsive embed-responsive-210by297">
              <object class="embed-responsive-item" data="manual.pdf"
                  type="application/pdf" internalinstanceid="9" title="">
                  <object data="manual.pdf" type="application/pdf" internalinstanceid="9"
                      title="">
                      <p>
                          Your browser isn't supporting embedded pdf files.
                          You can download the file
                          <a href="manual.pdf">here</a>.
                      </p>
                  </object>
              </object>
          </div>
   </div>
  `);
}

function eliminarImpresora(printer) {
  Pmgr.rmPrinter(printer).then(update);
  $("#dialogoEliminarImpresora" + printer).modal('toggle');
  
}

function eliminarGrupo(group) {
  Pmgr.rmGroup(group).then(update);
  $("#dialogoEliminarGrupo" + group).modal('toggle');

}

function eliminarTrabajo(job) {
  Pmgr.rmJob(job).then(update);
  $("#dialogoCancelarImpresión" + job).modal('toggle');

}

function updateImDer(printerId) {

  let printer = Pmgr.globalState.printers.find((p) => p.id == printerId);

  if (printer == undefined) {       // Error message when there's no printer to be displayed
    $("#imDerDatos").html(
      ` <b>Ninguna impresora seleccionada</b>  `);

    interfaceState.imSelectedPrinterId = -1;
    return;
  }

  interfaceState.imSelectedPrinterId = printer.id;   // Keep track of the selected printer 

  $("#imDerDatos").html(
    `
    <div class="col">
    <div class="row-4">
        <div class="row">
            <div class="col-9">
                <h2>
                    <!-- nombre archivo -->
                    ${printer.alias}

                    <!-- icono editar -->
                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#dialogoEditarImpresora"
                    data-bs-toggle="tooltip" data-bs-placement="top" title="Editar impresora">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-square" viewBox="1 1 14 14">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"></path>
                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"></path>
                    </svg>
                    </button>
                    <!-- icono eliminar impresora -->
                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#dialogoEliminarImpresora${printer.id}"
                    data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar impresora">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-trash-fill" viewBox="1 1 14 14">
                    <path fill-rule="evenodd" d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/>
                    </svg>
                    </button>                 
                </h2>

                <!-- Dialogo Modal Editar impresora -->
                <div class="modal fade" id="dialogoEditarImpresora" tabindex="-1"
                    role="dialog" aria-labelledby="exampleModalLabel"
                    aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="exampleModalLabel">
                                    Editar impresora ${printer.alias}</h5>
                                <button type="button" class="close" data-dismiss="modal"
                                    aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <form class="form-inline">
                                    <h6> <b>Nombre:</b></h6>
                                    <div class="form-group mx-sm-3 mb-2">
                                        <label for="inputNewName"
                                            class="sr-only">NuevoNombre</label>
                                        <input type="text"
                                            class="form-control-plaintext"
                                            id="inputNewName" value=${printer.alias}>
                                    </div>
                                </form>

                                <form class="form-inline">
                                    <h6> <b>IP:</b></h6>
                                    <div class="form-group mx-sm-3 mb-2">
                                        <label for="inputEditIP"
                                            class="sr-only">NuevaIP</label>
                                        <input type="text"
                                            class="form-control-plaintext"
                                            id="inputEditIP" value=${printer.ip}>
                                    </div>
                                </form>

                                <form class="form-inline">
                                    <h6> <b>Modelo:</b></h6>
                                    <div class="form-group mx-sm-3 mb-2">
                                        <label for="inputEditModel"
                                            class="sr-only">NuevoModelo</label>
                                        <input type="text"
                                            class="form-control-plaintext"
                                            id="inputEditModel" value=${printer.model}>
                                    </div>
                                </form>

                                <form class="form-inline">
                                    <h6> <b>Localización:</b></h6>
                                    <div class="form-group mx-sm-3 mb-2">
                                        <label for="inputNewLocation"
                                            class="sr-only">NuevaLocalizacion</label>
                                        <input type="text"
                                            class="form-control-plaintext"
                                            id="inputNewLocation" value="${printer.location}">
                                    </div>
                                </form>


                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary"
                                    data-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary">Editar
                                    impresora</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div class="col">
                <p>

                <div class="modal fade" id="dialogoEliminarImpresora${printer.id}" tabindex="-1"
                    role="dialog" aria-labelledby="elimImp"
                    aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="elimImp">
                                    Eliminar impresora ${printer.alias}</h5>
                                <button type="button" class="close" data-dismiss="modal"
                                    aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <form class="form-inline">
                                    <h6> ¿Estás seguro/a de que deseas eliminar la
                                        impresora ${printer.alias}? Esta acción no se puede deshacer</h6>

                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary"
                                    data-dismiss="modal">Cancelar</button>
                                <button type="button"
                                    class="btn btn-danger" onclick="eliminarImpresora(${printer.id})">Eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
                </p>
                <p></p>
            </div>
        </div>

        <div class="row">
            <div class="col-2">
                <!-- icono impresora -->
                ${statusToSVG(printer.status, 4)}
            </div>
            <div class="col">
                <!-- datos impresora -->
                <h4>     ID: ${printer.id}
                    <br> IP: ${printer.ip}
                    <br> Modelo: ${printer.model}
                    <br> Localización: ${printer.location}

                </h4>
            </div>
        </div>
    </div>

    <br>
    <br>
    <br>

    <!-- barra de filtrado -->
    <div class="row">
        <div class="col">
            <input class="form-control mr-sm-2" type="search" placeholder="Filtrar"
                aria-label="Search">
        </div>
        <div class="col-2">
            <button class="btn btn-primary" type="submit">Filtrar</button>
        </div>
    </div>

    <p></p>

    <div class="row-4">
        <h3><b>Grupos a los que pertenece</h3>
        <div class="card">
          <div class="row scroll-panel-derecho" id="imDerGrIncl">
          
          </div>
        </div>

    </div>
    <div class="row-4">
        <br>
        <h3><b>Grupos a los que añadir</h3>
        <div class="card">
          <div class="row scroll-panel-derecho" id="imDerGrAnyadir">
          
          </div>
    </div>
</div>
`);

  //console.log(getPrinterGroupsNot(printer));
  let listaGr = getPrinterGroups(printer);
  let listaGrNot = getPrinterGroupsNot(printer);

  for (let i = 0; i < listaGr.length; i++) {
    $("#imDerGrIncl").append(`
          
          <div class="col-3">
            <div class="card">
              <div class="row">
                <div class="col-8">
                  <h4>${listaGr[i].name} </h4>
                </div>
                
                <div class="col"> 
                <button class="btn btn-danger" type="button" onclick="rmPrinterfromGroup2(${listaGr[i].id})"
                data-toggle="modal" data-target="#dialogoEliminarImpresoraDeGrupo">×</button>  
                </div>
              </div>
      
              <div class="row">
                <div class="col">
      
                  
                </div >
              </div >
            </div >
          </div >

    `);
  }


  for (let i = 0; i < listaGrNot.length; i++) {
    $("#imDerGrAnyadir").append(`
          
          <div class="col-3">
            <div class="card">
              <div class="row">
                <div class="col-8">
                  <h4>${listaGrNot[i].name} </h4>
                </div>
                
                <div class="col"> 
                  <button class="btn btn-primary" onclick="addPrintertoGroup2(${listaGrNot[i].id})" type="button">+</button> 
                </div>
              </div>
      
              <div class="row">
                <div class="col">
      
                  
                </div >
              </div >
            </div >
          </div >

    `);
  }

}


function updateGrDer(groupId) {

  let group = Pmgr.globalState.groups.find((g) => g.id == groupId);

  if (group == undefined) {       // Error message when there's no group to be displayed
    $("#grDerDatos").html(
      `<b>Ningun grupo seleccionado</b>`);
    interfaceState.grSelectedGroupId = -1;
    return;
  }


  interfaceState.grSelectedGroupId = group.id;   // Keep track of the selected group 

  $("#grDerDatos").html(
    `
    
      <div class="row-4">
        <div class="row">
          <div class="col-9">
            <h2>
              <!-- nombre grupo -->
                    ${group.name}
              <!-- icono editar -->
              <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#dialogoEditarGrupo"
              data-bs-toggle="tooltip" data-bs-placement="top" title="Editar grupo">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-square" viewBox="1 1 14 14">
              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"></path>
              <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"></path>
              </svg>
              </button>
              <!-- boton eliminar grupo -->
              <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#dialogoEliminarGrupo${group.id}"
              data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar grupo">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-trash-fill" viewBox="1 1 14 14">
              <path fill-rule="evenodd" d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/>
              </svg>
              </button> 
            </h2>

            <!-- Dialogo Modal Editar Grupo -->
                <div class="modal fade" id="dialogoEditarGrupo" tabindex="-1"
              role="dialog" aria-labelledby="exampleModalLabel"
              aria-hidden="true">
              <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">
                      Editar grupo ${group.name}</h5>
                    <button type="button" class="close" data-dismiss="modal"
                      aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div class="modal-body">
                    <form class="form-inline">
                      <h6> <b>Nombre:</b></h6>
                      <div class="form-group mx-sm-3 mb-2">
                        <label for="inputEditGroupName"
                          class="sr-only">NuevoNombre</label>
                        <input type="text"
                          class="form-control-plaintext"
                          id="inputEditGroupName" value="${group.name}">
                                    </div>
                                </form>
                            </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary"
                        data-dismiss="modal">Cancelar</button>
                      <button type="button" class="btn btn-primary">Editar
                                    grupo</button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <div class="col">
              <p>                   
                  <div class="modal fade" id="dialogoEliminarGrupo${group.id}" tabindex="-1"
                    role="dialog" aria-labelledby="exampleModalLabel"
                    aria-hidden="true">
                    <div class="modal-dialog" role="document">
                      <div class="modal-content">
                        <div class="modal-header">
                          <h5 class="modal-title" id="exampleModalLabel">
                            Eliminar grupo ${group.name}</h5>
                          <button type="button" class="close" data-dismiss="modal"
                            aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                          </button>
                        </div>
                        <div class="modal-body">
                          <form class="form-inline">
                            <h6> ¿Estás seguro/a de que deseas eliminar el
                                        grupo ${group.name}? Esta acción no se puede deshacer</h6>

                          </form>
                        </div>
                        <div class="modal-footer">
                          <button type="button" class="btn btn-secondary"
                            data-dismiss="modal">Cancelar</button>
                          <button type="button"
                            class="btn btn-danger" onclick="eliminarGrupo(${group.id})">Eliminar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </p>
                <p></p>
            </div>
            </div>
          </div>

          <br>
            <br>
              <br>

                <!-- barra de filtrado -->
    <div class="row">
                  <div class="col-8">
                    <input class="form-control mr-sm-2" type="search" placeholder="Filtrar"
                      aria-label="Search">
        </div>
                    <div class="col">
                      <select class="browser-default custom-select">
                        <option selected="1">Nombre</option>
                        <option value="2">Localizacion</option>
                        <option value="3">ID</option>
                      </select>
                    </div>
                    <div class="col-2">
                      <button class="btn btn-primary" type="submit">Filtrar</button>
                    </div>
                  </div>
                  <p></p>

                  <!-- opciones añadidas de filtrado -->
    <button type="button" class="btn btn-secondary btn-sm filter-btn-space">Localización: Pepe
        ×</button>
                  <button type="button" class="btn btn-secondary btn-sm filter-btn-space">Grupo: Salón ×</button>
                  <p></p>

                  <div class="row-4">
                    <h3><b>Impresoras incluidas</h3>
                      <div class="card">
                        <div class="row scroll-panel-derecho" id="grDerImprIcluidas">

                        </div>
                      </div>
    </div>

                    <br>
                      <div class="row-4">
                        <h3><b>Impresoras a añadir</h3>
                          <div class="card">
                            <div class="row scroll-panel-derecho" id="grDerImprAnyadir">

                            </div>
                          </div>
    </div>
                      </div>
`);
  let printesGroup = getGroupPrinters(group);

  //console.log("Nombre del grupo de la impresora añadida: " + group.name + " " + group.id);
  for (let i = 0; i < printesGroup.length; i++) {

    $("#grDerImprIcluidas").append(`
     
    <div class="col-3">
      <div class="card">
        <div class="row">
          <div class="col-8">
            <h4>${printesGroup[i].alias} </h4>
          </div>
          
          <div class="col"> 
            <button class="btn btn-danger" type="button" onclick="rmPrinterfromGroup(${printesGroup[i].id})"
              data-toggle="modal" data-target="#dialogoEliminarImpresoraDeGrupo">×</button> 
          </div>
        </div>

        <div class="row">
          <div class="col">
          Localización: ${printesGroup[i].location}
          <br> ID: ${printesGroup[i].id}
          </div>
        </div>
      </div>
    </div>
  `);
  }

  let groupPrintersNot = getGroupPrintersNot(printesGroup);
  for (let i = 0; i < groupPrintersNot.length; i++) {
    $("#grDerImprAnyadir").append(`
          
          <div class="col-3">
            <div class="card">
              <div class="row">
                <div class="col-8">
                  <h4>${groupPrintersNot[i].alias} </h4>
                </div>
                
                <div class="col"> 
                  <button class="btn btn-primary" onclick="addPrintertoGroup(${groupPrintersNot[i].id})" type="button">+</button> 
                </div>
              </div>
      
              <div class="row">
                <div class="col">
                Localización: ${groupPrintersNot[i].location}
                  <br> ID: ${groupPrintersNot[i].id}
                </div>
              </div>
            </div>
          </div>
        
        `);

  }
}

function updateCiPopUp() {
  $("#dialogoNuevaImpresion").empty();


  $("#dialogoNuevaImpresion").append(
    `
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">
                    Nueva impresión</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form class="form">
                    <h6> <b>Archivo:</b></h6>
                    <input type="file" id="inputNewFileName" />
                    
                </form>

                <form class="form-inline">
                    <h6> <b>Propietario:</b></h6>
                    <div class="form-group mx-sm-3 mb-2">
                        <label for="inputNewFileOwner"
                            class="sr-only">NuevoPropietario</label>
                        <input type="text" class="form-control-plaintext"
                            id="inputNewFileOwner" placeholder="Propietario">
                    </div>
                </form>

                <form class="form-inline">
                    <h6> <b>Impresora/Grupo:</b></h6>
                    <div class="form-group mx-sm-3 mb-2">
                        <label for="inputNewFilePrinter"
                            class="sr-only">NuevaImpresora</label>
                        <div>
                            <select class="browser-default custom-select mr-sm-2"
                                id="ciPopUpSelect">
                            </select>

                        </div>
                    </div>
                </form>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary"
                    data-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="addJob()" id="botonAddJob">Añadir
                    impresión</button>
            </div>
        </div>
    </div>
    `

  );

  let printers = Pmgr.globalState.printers;
  for (let i = 0; i < printers.length; i++) {
    $("#ciPopUpSelect").append(` <option value="${i}">${"Impresora: " + printers[i].alias}</option> `);
  }

  let groups = Pmgr.globalState.groups;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].printers.length <= 0) {
      $("#ciPopUpSelect").append(` <option class="text-danger" value="${i + printers.length}">${"Grupo: " + groups[i].name}</option> `);
    }
    else {
      $("#ciPopUpSelect").append(` <option value="${i + printers.length}">${"Grupo: " + groups[i].name}</option> `);
    }
  }


}

// funcion para generar datos de ejemplo: impresoras, grupos, trabajos, ...
// se puede no-usar, o modificar libremente
async function populate(minPrinters, maxPrinters, minGroups, maxGroups, jobCount) {
  const U = Pmgr.Util;

  // genera datos de ejemplo
  minPrinters = minPrinters || 10;
  maxPrinters = maxPrinters || 20;
  minGroups = minGroups || 1;
  maxGroups = maxGroups || 3;
  jobCount = jobCount || 100;
  let lastId = 0;

  let printers = U.fill(U.randomInRange(minPrinters, maxPrinters),
    () => U.randomPrinter(lastId++));

  let groups = U.fill(U.randomInRange(minPrinters, maxPrinters),
    () => U.randomGroup(lastId++, printers, 50));

  let jobs = [];
  for (let i = 0; i < jobCount; i++) {
    let p = U.randomChoice(printers);
    let j = new Pmgr.Job(lastId++,
      p.id,
      [
        U.randomChoice([
          "Alice", "Bob", "Carol", "Daryl", "Eduardo", "Facundo", "Gloria", "Humberto"]),
        U.randomChoice([
          "Fernández", "García", "Pérez", "Giménez", "Hervás", "Haya", "McEnroe"]),
        U.randomChoice([
          "López", "Gutiérrez", "Pérez", "del Oso", "Anzúa", "Báñez", "Harris"]),
      ].join(" "),
      U.randomString() + ".pdf");
    p.queue.push(j.id);
    jobs.push(j);
  }

  if (Pmgr.globalState.token) {
    console.log("Updating server with all-new data");

    // FIXME: remove old data
    // FIXME: prepare update-tasks
    let tasks = [];
    for (let t of tasks) {
      try {
        console.log("Starting a task ...");
        await t().then(console.log("task finished!"));
      } catch (e) {
        console.log("ABORTED DUE TO ", e);
      }
    }
  } else {
    console.log("Local update - not connected to server");
    Pmgr.updateState({
      jobs: jobs,
      printers: printers,
      groups: groups
    });
  }
}

//
// PARTE 2:
// Código de pegamento, ejecutado sólo una vez que la interfaz esté cargada.
// Generalmente de la forma $("selector").cosaQueSucede(...)
//

// funcion de actualización de ejemplo. Llámala para refrescar interfaz
function update(result) {
  try {
    // vaciamos un contenedor
    $("#ciIzLista").empty();
    $("#imIzLista").empty();
    $("#grIzLista").empty();

    // aplicamos filtros activos
    let filteredJobs = applyCiSearch();
    let filteredPrinterList = applyImFilters();
    let filteredGroupList = applyGrSearch();

    // y lo volvemos a rellenar con su nuevo contenido
    filteredJobs.forEach(j => $("#ciIzLista").append(createJobItem(j)));
    filteredPrinterList.forEach(m => $("#imIzLista").append(createPrinterItem(m)));
    filteredGroupList.forEach(g => $("#grIzLista").append(createGroupItem(g)));

    // Inicializar interfaceState
    if (interfaceState == undefined) {
      // -1 means nothing selected, [] means no active filters
      interfaceState = new InterfaceState(-1, "", -1, [], -1, "", []);

      if (Pmgr.globalState.jobs.length > 0) {
        interfaceState.ciSelectedJobId = Pmgr.globalState.jobs[0].id;
      }
      if (Pmgr.globalState.printers.length > 0) {
        interfaceState.imSelectedPrinterId = Pmgr.globalState.printers[0].id;
      }
      if (Pmgr.globalState.groups.length > 0) {
        interfaceState.grSelectedGroupId = Pmgr.globalState.groups[0].id;
      }
    }

    // Rellenar panel de la derecha con el elemento seleccionado en cada pestaña
    updateCiDer(interfaceState.ciSelectedJobId);
    updateImDer(interfaceState.imSelectedPrinterId);
    updateGrDer(interfaceState.grSelectedGroupId);
    // Rellenar lista de botones de filtro en ImIz
    updateImIzFiltros();

    // Actualizar popup nueva impresion (para rellenar lista desplegable de impresoras y grupos)
    updateCiPopUp();

  } catch (e) {
    console.log('Error actualizando', e);
  }
}

$(function () {

  // Servidor a utilizar. También puedes lanzar tú el tuyo en local (instrucciones en Github)
  const serverUrl = "http://gin.fdi.ucm.es/iu/api/";
  Pmgr.connect(serverUrl);

  // ejemplo de login
  Pmgr.login("g3", "Grupo3Patata").then(d => {
    if (d !== undefined) {
      console.log("login ok!");
      update();
      // si login OK, entra siempre por aquí
    } else {
      console.log(`error en login(revisa la URL: ${serverUrl}, y verifica que está vivo)`);
      console.log("Generando datos de ejemplo para uso en local...")

      populate();
      update();
    }
  });

  //$("#botonAddJob").click(e => addJob($(e.target)));
  $("#botonAddImpresora").click(e => addPrinter($(e.target)));
  //$("#botonAddImpresoratoGroup0").click(e => addPrintertoGroup($(e.target)));
  $("#botonAddGroup").click(e => addGroup($(e.target)));



  $("#inputNewFileName").on('change', function () {
    var ext = $(this).val().split('.').pop();
    if ($(this).val() != '') {
      if (ext == "pdf") {
        alert("La extensión es: " + ext);

        //$("#modal-gral").hide();

      }
      else {
        $(this).val('');
        alert("Extensión no permitida: " + ext);
      }
    }
  });

});

// cosas que exponemos para usarlas desde la consola
window.update = update
window.Pmgr = Pmgr;
window.createPrinterItem = createPrinterItem
window.createGroupItem = createGroupItem
window.eliminarImpresora = eliminarImpresora
window.eliminarGrupo = eliminarGrupo
window.eliminarTrabajo = eliminarTrabajo
window.updateCiDer = updateCiDer
window.updateImDer = updateImDer
window.updateGrDer = updateGrDer
window.statusToSVG = statusToSVG
window.removeImFilter = removeImFilter
window.printerIsOnGroup = printerIsOnGroup
window.addPrintertoGroup = addPrintertoGroup
window.addPrintertoGroup2 = addPrintertoGroup2
window.rmPrinterfromGroup = rmPrinterfromGroup
window.rmPrinterfromGroup2 = rmPrinterfromGroup2
window.addGrSearchInput = addGrSearchInput
window.addCiSearchInput = addCiSearchInput
window.addJob = addJob
window.populate = populate;