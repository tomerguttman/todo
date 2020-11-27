//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const date = require(__dirname + "/date.js");
const port = 3000;
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser : true, useUnifiedTopology: true, useFindAndModify : false});

const itemSchema = {
   name : {
    type : String,
    required : [ true, "Please check your data entry, no name specified!"] }
};
const listSchema = {
  name : String,
  items : [itemSchema]
};
const List = new mongoose.model("List", listSchema);
const Item = new mongoose.model("Item", itemSchema);

app.get("/", function(req, res) {
  // const day = date.getDate();
  const items = Item.find({}, function(err, listItems) {
    if(err) {
      console.log(err);
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: listItems});
    }
  });
});

app.post("/delete", (req, res) => {
    const itemId = req.body.itemToRemoveId;
    const listName = req.body.listName;

    if(listName === "Today") {
      Item.findByIdAndRemove(itemId, function(err) {
        if(!err) { console.log(`Successfully deleted checked item <${itemId}>`); }
        res.redirect("/");
      });
    }
    else {
      // We need to find that list first.
      List.findOneAndUpdate({ name : listName}, { $pull : { items : { _id : itemId }}}, function(err, foundList) {
        if(!err) {
          res.redirect("/" + listName);
        }
    });
  }
});

app.post("/", function(req, res) {
  const itemText = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item({
    name : req.body.newItem
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
      List.findOne({ name : listName}, function(err, foundList) {
        if(!err) {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
        }
        else { console.log("There was an error with List.findOne()"); }
    });
  }
});

app.get("/:listName", function(req,res){
  const listName = req.params.listName;

  List.findOne({ name : listName }, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        const newList = new List({
          name : listName,
          items : []
        });

        newList.save();
        res.redirect("/" + listName);
      }
      else {
        const listItems = List.find({ name : listName});
        res.render("list", {listTitle: foundList.name , newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log(`Server started on http://localhost:${port}`);
});
