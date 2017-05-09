// ----- Ember modules -----
import Service from 'ember-service'
import EventedMixin from 'ember-evented'
import {next} from 'ember-runloop'



export default Service.extend(EventedMixin, {

  // ----- Static properties -----
  isDragging       : false,
  isDraggingUp     : null,
  previousPointerY : null,

  draggedItem : null,
  group       : null,

  sourceList  : null,
  targetList  : null,
  sourceIndex : null,
  targetIndex : null,



  // ----- Custom methods -----
  startDragging ({item, index, items, group, event: {clientY}}) {
    this.setProperties({
      isDragging       : true,
      isDraggingUp     : false,
      previousPointerY : clientY,

      draggedItem : item,
      group,

      sourceList  : items,
      targetList  : items,
      sourceIndex : index,
      targetIndex : index - 1,
    })

    next(() => {
      this.trigger('start', {
        group,
        draggedItem : item,
        sourceList  : items,
        sourceIndex : index,
      })
    })
  },



  draggingOver ({group, index, items, isDraggingUp}) {
    // Ignore hovers over irrelevant groups
    if (group !== this.get('group')) return

    // Ignore hovers over irrelevant lists
    if (items !== this.get('targetList')) return

    if (index !== this.get('targetIndex')) {
      next(() => {
        this.trigger('sort', {
          group,
          sourceList     : this.get('sourceList'),
          sourceIndex    : this.get('sourceIndex'),
          draggedItem    : this.get('draggedItem'),
          targetList     : this.get('targetList'),
          oldTargetIndex : this.get('targetIndex'),
          newTargetIndex : index,
        })
      })
    }

    // Remember current index and direction
    this.setProperties({
      targetIndex : index,
      isDraggingUp
    })

    // console.log('draggingOver targetIndex', index)
  },



  dragEntering ({group, items}) {
    // Ignore entering irrelevant groups
    if (group !== this.get('group')) return

    // Reset index when entering a new list
    if (items !== this.get('targetList')) {

      next(() => {
        this.trigger('move', {
          group,
          sourceList    : this.get('sourceList'),
          sourceIndex   : this.get('sourceIndex'),
          draggedItem   : this.get('draggedItem'),
          oldTargetList : this.get('targetList'),
          newTargetList : items,
          targetIndex   : 0,
        })
      })

      this.set('targetIndex', 0)

      // console.log('dragEntering: targetIndex set to 0')
    }

    // Remember entering a new list
    this.set('targetList', items)
  },



  endDragging ({action}) {
    const sourceList   = this.get('sourceList')
    const sourceIndex  = this.get('sourceIndex')
    const targetList   = this.get('targetList')
    let   targetIndex  = this.get('targetIndex')
    const isDraggingUp = this.get('isDraggingUp')
    const group        = this.get('group')
    const draggedItem  = this.get('draggedItem')

    // console.log('targetIndex1', targetIndex)

    // Account for dragged item shifting indexes by one
    if (
      sourceList === targetList
      && targetIndex > sourceIndex
    ) targetIndex--

    // console.log('targetIndex2', targetIndex)

    // Account for dragging down
    if (
      // Dragging down
      !isDraggingUp

      // Target index is not after the last item
      && targetIndex < targetList.get('length')

      // The only element in target list is not the one dragged
      && !(
        targetList.get('length') === 1
        && targetList.get('firstObject') === draggedItem
      )
    ) targetIndex++

    // console.log('targetIndex3', targetIndex)

    this._reset()

    next(() => {
      if (typeof action === 'function') {
        action({
          group,
          draggedItem,
          sourceList,
          sourceIndex,
          targetList,
          targetIndex
        })
      }

      this.trigger('end', {
        group,
        draggedItem,
        sourceList,
        sourceIndex,
        targetList,
        targetIndex
      })
    })
  },

  _reset () {
    this.setProperties({
      isDragging       : false,
      isDraggingUp     : null,
      previousPointerY : null,

      draggedItem : null,
      group       : null,

      sourceList  : null,
      targetList  : null,
      sourceIndex : null,
      targetIndex : null,
    })
  },
})