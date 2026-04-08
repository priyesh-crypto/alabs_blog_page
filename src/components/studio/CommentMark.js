import { Mark, mergeAttributes } from '@tiptap/core';

export const CommentMark = Mark.create({
  name: 'comment',
  
  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) return {};
          return {
            'data-comment-id': attributes.commentId,
            class: 'inline-comment-mark',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setComment: (commentId) => ({ commands }) => {
        return commands.setMark(this.name, { commentId });
      },
      unsetComment: (commentId) => ({ tr, dispatch }) => {
        if (!dispatch) return false;
        
        let hasMark = false;
        
        tr.doc.descendants((node, pos) => {
          if (!node.isText) return;
          const mark = node.marks.find(m => m.type.name === this.name && m.attrs.commentId === commentId);
          if (mark) {
            hasMark = true;
            tr.removeMark(pos, pos + node.nodeSize, mark.type);
          }
        });
        
        return hasMark;
      },
    };
  },
});
