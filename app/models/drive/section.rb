module Drive
  class Section < ActiveRecord::Base
    self.table_name = "sections"

    belongs_to :discette
    belongs_to :category
    has_many :section_users
    # has_many :section_users, dependent: :destroy

    has_many :users, through: :section_users

    # after_save :destroy_deletions

    # validate :name_format_validator
    # validates_uniqueness_of :name, case_sensitive: false

    serialize :meta, JSON


  end
end
