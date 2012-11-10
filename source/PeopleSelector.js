enyo.kind({
    name: "PeopleSelector",
    classes: "peopleselector",
    kind: "FittableRows",
    published: {
        items: []
    },
    events: {
        onChange: ""
    },
    create: function() {
        this.inherited(arguments);
        this.selectedItems = {};
        this.selectedItemsArray= [];
    },
    itemsChanged: function() {
        this.filteredItems = this.items;
        this.refreshList();
    },
    setSelectedItems: function(items) {
        this.selectedItems = {};
        for (var i=0; i<items.length; i++) {
            this.selectedItems[items[i].id] = items[i];
        }
    },
    getSelectedItems: function() {
        var items = [];
        for (var x in this.selectedItems) {
            items.push(this.selectedItems[x]);
        }
        return items;
    },
    isSelected: function(item) {
        var found = this.selectedItems[item.id];
        return found !== undefined && found !== null;
    },
    keyupHandler: function(sender, event) {
        var searchString = this.$.searchInput.getValue();

        if (searchString) {
            this.filteredItems = this.items.filter(enyo.bind(this, function(item) {
                var fullName = item.first_name + " " + item.last_name;
                var pattern = new RegExp(searchString, "i");
                return item.username.search(pattern) != -1 ||
                    fullName.search(pattern) != -1 ||
                    this.isSelected(item);
            }));

            this.refreshList();
        } else {
            this.filteredItems = this.items;
        }
    },
    itemTap: function(sender, event) {
        var item = this.filteredItems[event.index];
        if (!this.isSelected(item)) {
            this.selectItem(item);
        } else {
            this.deselectItem(item);
        }
        sender.addRemoveClass("selected", this.isSelected(item));
        this.doChange();
    },
    selectItem: function(item) {
        this.selectedItems[item.id] = item;
    },
    deselectItem: function(item) {
        delete this.selectedItems[item.id];
    },
    refreshList: function() {
        this.$.list.setCount(this.filteredItems.length);
        this.$.list.render();
    },
    setupItem: function(sender, event) {
        var item = this.filteredItems[event.index];
        // event.item.$.user.applyStyle("background-image", "url(" + item.profile.avatar + ")");
        event.item.$.avatar.setSrc(item.profile.avatar_thumbnail);
        event.item.$.avatar.addRemoveClass("selected", this.isSelected(item));
        return true;
    },
    components: [
        {kind: "onyx.InputDecorator", style: "width: 100%; box-sizing: border-box;", components: [
            {kind: "onyx.Input", name: "searchInput", style: "width: 100%;", onkeyup: "keyupHandler", placeholder: "Type to filter..."}
        ]},
        {kind: "Repeater", name: "list", onSetupItem: "setupItem", style: "text-align: center", components: [
            {kind: "Image", name: "avatar", classes: "peopleselector-avatar", ontap: "itemTap"}
        ]}
    ]
});


// enyo.kind({
//  name: "PeopleSelector",
//  classes: "peopleselector",
//  create: function() {
//      this.inherited(arguments);
//      this.selectedItems = {};
//      this.selectedItemsArray= [];
//  },
//  setSelectedItems: function(items) {
//      this.selectedItems = {};
//      for (var i=0; i<items.length; i++) {
//          this.selectedItems[items[i].id] = items[i];
//      }
//      this.refreshSelectedItems();
//  },
//  getSelectedItems: function() {
//      var items = [];
//      for (var x in this.selectedItems) {
//          items.push(this.selectedItems[x]);
//      }
//      return items;
//  },
//  isSelected: function(item) {
//      var found = this.selectedItems[item.id];
//      return found !== undefined && found !== null;
//  },
//  keyupHandler: function(sender, event) {
//      if (event.keyCode == 40) {
//          this.selected = this.selected < this.filteredItems.length-1 ? this.selected+1 : this.filteredItems.length-1;
//          event.preventDefault();
//             this.refreshList();
//      } else if (event.keyCode == 38) {
//          this.selected = this.selected ? this.selected-1 : 0;
//          event.preventDefault();
//             this.refreshList();
//      } else if (event.keyCode == 13) {
//          var item = this.filteredItems[this.selected];
//          if (item) {
//              this.selectItem(item);
//          } else if (this.allowNewItem) {
//              this.newItem();
//          }
//      }  else {
//          var searchString = this.$.searchInput.getValue();

//          if (searchString) {
//              chuisy.user.list([["username", searchString, "contains"]], enyo.bind(this, function(sender, response) {
//                  this.filteredItems = response.objects.filter(enyo.bind(this, function(item) {
//                      return !this.isSelected(item);
//                  }));

//                  this.$.list.setCount(this.filteredItems.length);
//                  this.selected = 0;
                    
//                  if (this.filteredItems.length) {
//                      this.showPopup();
//                  } else {
//                      this.$.popup.hide();
//                  }
//              }));
//          }
//      }
//  },
//  keydownHandler: function(sender, event) {
//      if (event.keyCode == 8 && !this.$.searchInput.getValue()) {
//          this.popItem();
//      }
//  },
//  showPopup: function() {
//      this.$.popup.show();
//      var inputBounds = this.$.searchInput.getBounds();
//      this.$.popup.applyStyle("top", inputBounds.top + 20 + "px");
//      this.$.popup.applyStyle("left", inputBounds.left + "px");
//         this.refreshList();
//  },
//  itemClick: function(sender, event) {
//      this.selectItem(this.filteredItems[event.index]);
//      this.$.searchInput.focus();
//  },
//  selectItem: function(item) {
//      this.selectedItems[item.id] = item;
//      this.refreshSelectedItems();
//      this.$.popup.hide();
//      this.$.searchInput.setValue("");
//  },
//  deselectItem: function(item) {
//      delete this.selectedItems[item.id];
//      this.refreshSelectedItems();
//  },
//  popItem: function() {
//      var selectedItems = this.getSelectedItems();
//      var item = selectedItems[selectedItems.length-1];
//      if (item) {
//          this.deselectItem(item);
//      }
//  },
//     refreshList: function() {
//         this.$.list.render();
//         this.$.list.performOnRow(this.selected, function() {
//             this.$.scroller.scrollIntoView(this.$.listItem);
//         }, this);
//     },
//  refreshSelectedItems: function() {
//      this.selectedItemsArray = this.getSelectedItems();
//      this.$.selectedList.setCount(this.selectedItemsArray.length);
//      this.$.selectedList.render();
//  },
//  removeItemTapped: function(sender, event) {
//      var item = this.getSelectedItems()[event.index];
//      this.deselectItem(item);
//  },
//     setupItem: function(sender, event) {
//         var item = this.selectedItemsArray[event.index];
//         this.$.label.setContent(item.username);
//         return true;
//     },
//     popupSetupItem: function(sender, event) {
//         var item = this.filteredItems[event.index];
//         this.$.listItem.addRemoveClass("selected", event.index == this.selected);
//         this.$.listItem.setContent(item.username);
//     },
//     components: [
//         {kind: "FlyweightRepeater", name: "selectedList", classes: "peopleselector-selected-list", onSetupItem: "setupItem", components: [
//             {classes: "peopleselector-selected-item", components: [
//                 {classes: "peopleselector-selected-item-label", name: "label"},
//                 {kind: "onyx.IconButton", src: "assets/images/x.png", classes: "peopleselector-removebutton", ontap: "removeItemTapped"}
//             ]}
//         ]},
//         {kind: "onyx.InputDecorator", style: "width: 100%; box-sizing: border-box;", components: [
//             {kind: "onyx.Input", name: "searchInput", onkeyup: "keyupHandler", onkeydown: "keydownHandler", placeholder: "Start typing to add people..."},
//             {kind: "enyo.Popup", style: "width: 200px; max-height: 200px;", classes: "peopleselector-popup onyx-menu onyx-picker", components: [
//                 {kind: "Scroller", style: "max-height: inherit;", components: [
//                     {kind: "FlyweightRepeater", name: "list", onSetupItem: "popupSetupItem", components: [
//                         {kind: "onyx.Item", tapHighlight: true, ontap: "itemClick", name: "listItem", classes: "peopleselector-listitem onyx-menu-item"}
//                     ]}
//                 ]}
//             ]}
//         ]}
//     ]
// });