var _ = require('lodash');
var paths = require('./lib/paths');
var Project = require('./lib/project');

// module.exports = patcher([
//   createRemoveMoveStories,
//   iterationDeletes,
//   commentDeletes,
//   taskDeletes,
//   storyDeleteAndMoveFromProject,
//   epicDeletes,
//   labelAttrs,
//   iterationAttrs,
//   storyAttrs,
//   epicAttrs,
//   taskAttrs,
//   commentAttrs,
//   storyMoves,
//   epicMoves,
//   projectVersion
// ]);

function patchResults(projectJSON, command) {
  var params = {
    project: new Project(projectJSON),
    command: command
  }

  _.compose(
    projectVersion,
    taskInner,
    taskOuter,
    storyCommentInner,
    storyCommentOuter,
    storyAttr,
    storyMove,
    storyCreate,
    storyDelete
  )(params);

  return params.project.log;
}

module.exports = patchResults;

function storyDelete(params) {
  _.chain(params.command.results)
    .filter(function(r) {
      return r.type === 'story' && (r.deleted || r.moved);
    })
    .each(function(r) {
      params.project.removeStory(r.id);
    })
    .value();

  return params;
}

function storyCreate(params) {
  _.chain(params.command.results)
    .filter(function(r) {
      return r.type === 'story' && !(r.deleted || r.moved) && !params.project.hasStory(r.id);
    })
    .each(function(r) {
      params.project.appendStory(r.id);
    })
    .value();

  return params;
}

function storyMove(params) {
  _.chain(params.command.results)
    .filter(function(r) {
      return r.type === 'story' && !(r.deleted || r.moved) && params.project.hasStory(r.id);
    })
    .sortBy(function(r) {
      return -1 * params.project.indexOfStory(r.id);
    })
    .map(function(r) {
      var index = params.project.indexOfStory(r.id);
      var afterId = params.project.storyAtIndex(index - 1);
      var beforeId = params.project.storyAtIndex(index + 1);

      return _.extend({
        after_id: afterId,
        before_id: beforeId
      }, r);
    })
    .each(function(r) {
      if (r.before_id) {
        params.project.moveStoryBefore(r.id, r.before_id);
      } else if (r.after_id) {
        params.project.moveStoryAfter(r.id, r.after_id);
      }
    })
    .value();

  return params;
}

function storyAttr(params) {
  _.chain(params.command.results)
    .filter(function(r) {
      return r.type === 'story' && !(r.deleted || r.moved) && params.project.hasStory(r.id);
    })
    .each(function(r) {
      _.chain([
        'created_at',
        'updated_at',
        'accepted_at',
        'estimate',
        'story_type',
        'name',
        'description',
        'current_state',
        'requested_by_id',
        'owner_ids',
        'label_ids',
        'follower_ids',
        'owned_by_id',
        'tasks',
        'comments'
      ])
      .filter(function(attr) {
        return _.has(r, attr);
      })
      .each(function(attr) {
        params.project.setStoryAttr(r.id, attr, r[attr]);
      })
      .value();
    })
    .value();

  return params;
}

function storyCommentOuter(params) {
  return params;
}

function storyCommentInner(params) {
  return params;
}

function taskOuter(params) {
  return params;
}

function taskInner(params) {
  return params;
}

function projectVersion(params) {
  params.project.updateVersion(params.command.project.version);
}

// function setAttr(project, path, value) {
//   if (!project.has(path)) {
//     return [{op: 'add', path: path, value: value}];
//   }
//   else if (_.isNull(value)) {
//     return [{op: 'remove', path: path}];
//   }
//   else if (value !== project.get(path)) {
//     return [{op: 'replace', path: path, value: value}];
//   }
//   return [];
// }

// function createRemoveMoveStories(project, command) {
//   return _.chain(command.results)
//     .filter(function(r) { return r.type === 'story' })
//     .filter(function(r) { return r.deleted === 'story' })
//     .value()
// }

// function firstStory(beforeIds) {
//   var keys = _.chain(beforeIds).keys().map(function(k) { return Number(k) }).value();
//   var values = _.values(beforeIds);
//   return _.first(_.difference(keys, values));
// }

// function orderList(beforeIds) {
//   var ids = [];
//   var id = firstStory(beforeIds);

//   ids.push(Number(id));
//   while (beforeIds[id] !== -1) {
//     ids.push(beforeIds[id]);
//     id = beforeIds[id];
//   }

//   return ids;
// }

// function storyMoves(project, command) {
//   var patch = [];
//   var ids = project.storyIds();

//   var storyResults = _.chain(command.results)
//     .filter(typeStory)
//     .filter(notDeleted)
//     .filter(function(r) {
//       return project.indexOfStoryById(r.id) !== -1;
//     })
//     .reduce(function(memo, result) {
//       var beforeId = null;
//       var afterId = null;
//       var beforeIndex = ids.indexOf(result.id) + 1;
//       var afterIndex = ids.indexOf(result.id) - 1;

//       if (beforeIndex >= 0 && beforeIndex < ids.length) {
//         beforeId = ids[beforeIndex]
//       }

//       if (afterIndex >= 0 && afterIndex < ids.length) {
//         afterId = ids[afterIndex]
//       }

//       memo.push(_.extend({
//         before_id: beforeId,
//         after_id: afterId
//       }, result));

//       return memo;
//     }, [])
    // .sortBy(function(r) {
    //   return -1 * project.indexOfStoryById(r.id);
    // })
    // .each(function(result) {
    //   var id, from, to;

    //   if (result.before_id) {
    //     from = ids.indexOf(result.id);
    //     id = ids.splice(from, 1)[0];
    //     to = ids.indexOf(result.before_id);
    //     ids.splice(to, 0, id);
    //     patch.push({op: 'move', path: paths.story(to), from: paths.story(from)});
    //   } else if (result.after_id) {
    //     from = ids.indexOf(result.id);
    //     id = ids.splice(from, 1)[0];
    //     to = ids.indexOf(result.after_id) + 1;
    //     ids.splice(to, 0, id);
    //     patch.push({op: 'move', path: paths.story(to), from: paths.story(from)});
    //   }
    // }).value();

//   return patch;
// }

// function storyDeleteAndMoveFromProject(project, command) {
//   return _.chain(command.results)
//     .filter(typeStory)
//     .filter(isDeletedOrMoved)
//     .sortBy(function(r) { return -1 * project.indexOfStoryById(r.id); })
//     .reduce(function(patch, result) {
//       patch.push({op: 'remove', path: project.pathOfStoryById(result.id)});
//       return patch;
//     }, [])
//     .value();
// }

// var STORY_ATTRS = [
//   'id',
//   'created_at',
//   'updated_at',
//   'accepted_at',
//   'estimate',
//   'story_type',
//   'name',
//   'description',
//   'current_state',
//   'requested_by_id',
//   'owner_ids',
//   'label_ids',
//   'follower_ids',
//   'owned_by_id',
//   'tasks',
//   'comments'
// ];

// function storyAttrs(project, command) {
//   var patch = [];

//   var ids = project.storyIds();

//   command.results
//     .filter(typeStory)
//     .filter(notDeleted)
//     .forEach(function(result) {
//       var index = project.indexOfStoryById(result.id);
//       var original = project.storyById(result.id);

//       if (!original && (_.has(result, 'after_id') || _.has(result, 'before_id'))) {
//         var newIndex = ids.length;
//         var beforeIndex = ids.indexOf(result.before_id);
//         var afterIndex = ids.indexOf(result.after_id);

//         if (beforeIndex !== -1) {
//           newIndex = beforeIndex;
//           ids.splice(newIndex, 0, result.id);

//         } else if (afterIndex !== -1) {
//           newIndex = afterIndex + 1;
//           ids.splice(newIndex, 0, result.id);
//         }

//         patch.push({
//           op: 'add',
//           path: paths.story(newIndex),
//           value: _.defaults(_.pick(result, STORY_ATTRS), {comments: [], tasks: []})
//         });

//         return;
//       }

//       STORY_ATTRS
//         .filter(_.partial(_.has, result))
//         .forEach(function(attr) {
//           var path = paths.storyAttr(index, attr);
//           patch = patch.concat(setAttr(project, path, result[attr]))
//         });
//     });

//   return patch;
// }

// var ITERATION_ATTRS = [
//   'number',
//   'length',
//   'team_strength'
// ];

// function iterationDeletes(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeIteration)
//     .filter(lengthDefault)
//     .forEach(function(result) {
//       var path = project.pathOfIterationOverrideByNumber(result.number);

//       patch.push({op: 'remove', path: path});
//     });

//   return patch;
// }

// function iterationAttrs(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeIteration)
//     .filter(lengthNotDefault)
//     .forEach(function(result) {
//       var path = project.pathOfIterationOverrideByNumber(result.number);

//       if (project.has(path)) {
//         ITERATION_ATTRS
//           .filter(_.partial(_.has, result))
//           .forEach(function(attr) {
//             var path = path + '/' + attr;
//             patch = patch.concat(setAttr(project, path, result[attr]))
//           });

//       } else {
//         var newIndex = _.sortedIndex(project.overrideIterationNumbers(), result.number);

//         var defaults = {
//           team_strength: 1.0
//         }

//         patch.push({
//           op: 'add',
//           path: paths.iterationOverride(newIndex),
//           value: _.defaults(_.pick(result, ITERATION_ATTRS), defaults)
//         });
//       }

//     });

//   return patch;
// }

// function labelAttrs(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeLabel)
//     .filter(notDeleted)
//     .forEach(function(result) {
//       var newIndex = _.sortedIndex(project.labelNames(), result.name);

//       patch.push(
//         {op: 'add', path: paths.label(newIndex), value: _.pick(result, 'id', 'name', 'created_at', 'updated_at')}
//       );
//     });

//   return patch;
// }

// var TASK_ATTRS = [
//   'id',
//   'description',
//   'complete',
//   'created_at',
//   'updated_at'
// ];

// function taskAttrs(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeTask)
//     .filter(notDeleted)
//     .forEach(function(result) {
//       var newIndex = result.position - 1;
//       var storyIndex = project.indexOfStoryById(result.story_id);

//       patch.push(
//         {op: 'add', path: paths.storyTask(storyIndex, newIndex), value: _.pick(result, TASK_ATTRS)}
//       );
//     });

//   return patch;
// }

// function taskDeletes(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeTask)
//     .filter(isDeleted)
//     .forEach(function(result) {
//       var path = project.pathOfStoryTaskById(result.id);

//       patch.push(
//         {op: 'remove', path: path}
//       );
//     });

//   return patch;
// }

// var EPIC_ATTRS = [
//   'id',
//   'created_at',
//   'updated_at',
//   'name',
//   'description',
//   'label_id',
//   'follower_ids',
//   'past_done_stories_count',
//   'past_done_stories_no_point_count',
//   'past_done_story_estimates'
// ];

// function epicAttrs(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeEpic)
//     .filter(notDeleted)
//     .forEach(function(result) {
//       var path = project.pathOfEpicById(result.id);
//       var original = project.get(path);

//       if (original) {
//         EPIC_ATTRS
//           .filter(_.partial(_.has, result))
//           .forEach(function(attr) {
//             patch = patch.concat(setAttr(project, path + '/' + attr, result[attr]))
//           });
//       } else {
//         var beforeIndex = project.indexOfEpicById(result.before_id);
//         patch.push({
//           op: 'add',
//           path: paths.epic(beforeIndex),
//           value: _.defaults(_.pick(result, EPIC_ATTRS), {comments: []})
//         });
//       }
//     });

//   return patch;
// }

// function epicDeletes(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeEpic)
//     .filter(isDeleted)
//     .forEach(function(result) {
//       patch.push(
//         {op: 'remove', path: project.pathOfEpicById(result.id)}
//       );
//     });

//   return patch;
// }

// function epicMoves(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeEpic)
//     .forEach(function(result) {
//       var index = project.indexOfEpicById(result.id);

//       if (index === -1) {
//         return;
//       }

//       if (result.after_id) {
//         var newIndex = project.indexOfEpicById(result.after_id);
//         if (newIndex < index) {
//           newIndex += 1;
//         }

//         patch.push(
//           {op: 'move', path: paths.epic(newIndex), from: paths.epic(index)}
//         );
//       }
//       else if (result.before_id) {
//         var beforeIndex = project.indexOfEpicById(result.before_id);

//         patch.push(
//           {op: 'move', path: path.epic(beforeIndex), from: paths.epic(index)}
//         );
//       }
//     });

//   return patch;
// }




// function commentAttrs(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeComment)
//     .filter(notDeleted)
//     .forEach(function(result) {

//       // new story comment
//       // new epic comment
//       // new comment existing story
//       // new comment existing epic
//       // update comment existing story
//       // update comment existing epic

//       var commentPath;

//       var storyIndex = project.indexOfStoryById(result.story_id);
//       if (storyIndex !== -1) {
//         commentPath = paths.storyComment(storyIndex, 0);
//       }

//       var epicIndex = project.indexOfEpicById(result.epic_id);
//       if (epicIndex !== -1) {
//         commentPath = paths.epicComment(epicIndex, 0);
//       }

//       var originalComment = project.get(commentPath);
//       if (!originalComment) {
//         var addOpValue = _.pick(result,
//           'id',
//           'text',
//           'person_id',
//           'created_at',
//           'updated_at'
//         );

//         if (result.google_attachment_ids && result.google_attachment_ids.length) {
//           addOpValue.google_attachments = [];

//           result.google_attachment_ids.forEach(function(gaId) {
//             var gaResult = _.where(command.results, {type: 'google_attachment', id: gaId})[0];

//             addOpValue.google_attachments.push(_.pick(gaResult,
//               'id',
//               'google_kind',
//               'person_id',
//               'resource_id',
//               'alternate_link',
//               'google_id',
//               'title'
//             ));
//           });
//         }

//         if (result.file_attachment_ids && result.file_attachment_ids.length) {
//           addOpValue.file_attachments = [];

//           result.file_attachment_ids.forEach(function(fileId) {
//             var fileResult = _.where(command.results, {type: 'file_attachment', id: fileId})[0];

//             addOpValue.file_attachments.push(_.pick(fileResult,
//               'id',
//               'filename',
//               'uploader_id',
//               'created_at',
//               'content_type',
//               'size',
//               'download_url',
//               'uploaded',
//               'thumbnailable',
//               'height',
//               'width',
//               'thumbnail_url',
//               'big_url'
//             ));
//           });
//         }

//         patch.push({
//           op: 'add',
//           path: commentPath,
//           value: _.defaults(addOpValue, {
//             google_attachments: [],
//             file_attachments: []
//           })
//         });
//       }
//     });

//   return patch;
// }

// function commentDeletes(project, command) {
//   var patch = [];

//   command.results
//     .filter(typeComment)
//     .filter(isDeleted)
//     .forEach(function(result) {
//       var path = project.pathOfCommentById(result.id);

//       patch.push(
//         {op: 'remove', path: path}
//       );
//     });

//   return patch;
// }

// function typeStory(result) {
//   return result.type === 'story';
// }

// function typeIteration(result) {
//   return result.type === 'iteration';
// }

// function typeEpic(result) {
//   return result.type === 'epic';
// }

// function typeComment(result) {
//   return result.type === 'comment';
// }

// function typeLabel(result) {
//   return result.type === 'label';
// }

// function typeTask(result) {
//   return result.type === 'task';
// }

// function typeGoogleAttachment(result) {
//   return result.type === 'google_attachment';
// }

// function isDeleted(result) {
//   return result.deleted === true;
// }

// function isDeletedOrMoved(result) {
//   return result.deleted === true || result.moved === true;
// }

// function notDeleted(result) {
//   return !result.deleted;
// }

// function lengthDefault(result) {
//   return result.length === 'default';
// }

// function lengthNotDefault(result) {
//   return result.length !== 'default';
// }

// function patcher(patchers) {
//   return function(projectJSON, command) {
//     var project = new Project(projectJSON);

//     return patchers.reduce(function(patch, patcher) {
//       return patch.concat(patcher(project, command));
//     }, []);
//   }
// }
